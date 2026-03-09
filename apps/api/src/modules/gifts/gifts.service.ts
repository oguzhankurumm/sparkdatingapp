import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq, desc, count, or, and } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { giftTypes, sentGifts, users } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import {
  TOKEN_ECONOMY,
  type GiftContext,
  type GiftTypeItem,
  type SendGiftResponse,
  type GiftHistoryItem,
  type GiftHistoryResponse,
} from '@spark/types'

@Injectable()
export class GiftsService {
  private readonly logger = new Logger(GiftsService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  // ── Gift Types (Catalog) ──────────────────────────────

  /**
   * List all active gift types, ordered by sortOrder.
   * Optionally filter by category.
   */
  async listGiftTypes(category?: string): Promise<GiftTypeItem[]> {
    try {
      let query = this.db
        .select({
          id: giftTypes.id,
          name: giftTypes.name,
          description: giftTypes.description,
          imageUrl: giftTypes.imageUrl,
          animationUrl: giftTypes.animationUrl,
          tokenCost: giftTypes.tokenCost,
          category: giftTypes.category,
          sortOrder: giftTypes.sortOrder,
        })
        .from(giftTypes)
        .where(eq(giftTypes.isActive, true))
        .orderBy(giftTypes.sortOrder)
        .$dynamic()

      if (category) {
        query = query.where(and(eq(giftTypes.isActive, true), eq(giftTypes.category, category)))
      }

      return await query
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error listing gift types', error)
      throw error
    }
  }

  // ── Send Gift ─────────────────────────────────────────

  /**
   * Send a gift from one user to another.
   * Deducts tokens from sender, credits 80% to receiver, records the gift.
   * No match required — anyone can gift anyone.
   */
  async sendGift(
    senderId: string,
    recipientId: string,
    giftTypeId: string,
    context: GiftContext,
    contextReferenceId?: string,
  ): Promise<SendGiftResponse> {
    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send a gift to yourself')
    }

    try {
      // 1. Look up the gift type
      const [gift] = await this.db
        .select()
        .from(giftTypes)
        .where(eq(giftTypes.id, giftTypeId))
        .limit(1)

      if (!gift || !gift.isActive) {
        throw new NotFoundException('Gift type not found or inactive')
      }

      // 2. Verify recipient exists
      const [recipient] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1)

      if (!recipient) {
        throw new NotFoundException('Recipient not found')
      }

      // 3. Calculate split
      const tokensCost = gift.tokenCost
      const platformCut = Math.floor(tokensCost * (TOKEN_ECONOMY.PLATFORM_CUT_PERCENT / 100))
      const tokensToReceiver = tokensCost - platformCut

      // 4. Deduct from sender (this checks balance internally)
      await this.walletService.deductTokens(
        senderId,
        tokensCost,
        'gift_sent',
        `Sent ${gift.name} gift`,
        giftTypeId,
        'gift',
      )

      // 5. Credit to receiver
      await this.walletService.creditTokens(
        recipientId,
        tokensToReceiver,
        'gift_received',
        `Received ${gift.name} gift`,
        giftTypeId,
        'gift',
      )

      // 6. Record the sent gift
      await this.db.insert(sentGifts).values({
        senderId,
        receiverId: recipientId,
        giftTypeId,
        context,
        contextReferenceId: contextReferenceId ?? null,
        tokensCost,
        tokensToReceiver,
        platformCut,
      })

      // 7. Get updated balance
      const newBalance = await this.walletService.getBalance(senderId)

      this.logger.log(
        `Gift sent: ${gift.name} from=${senderId} to=${recipientId} cost=${tokensCost} context=${context}`,
      )

      return {
        success: true,
        newBalance,
        giftId: gift.id,
        tokensCharged: tokensCost,
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error sending gift: sender=${senderId}`, error)
      throw error
    }
  }

  // ── Gift History ──────────────────────────────────────

  /**
   * Get gift history for a user (both sent and received).
   * direction: 'sent' | 'received' | 'all'
   */
  async getGiftHistory(
    userId: string,
    direction: 'sent' | 'received' | 'all' = 'all',
    page = 1,
    limit = 20,
  ): Promise<GiftHistoryResponse> {
    try {
      const offset = (page - 1) * limit

      // Build where condition based on direction
      const whereCondition =
        direction === 'sent'
          ? eq(sentGifts.senderId, userId)
          : direction === 'received'
            ? eq(sentGifts.receiverId, userId)
            : or(eq(sentGifts.senderId, userId), eq(sentGifts.receiverId, userId))

      // Aliases for sender/receiver joins
      const sender = this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .as('sender_user')

      const receiver = this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .as('receiver_user')

      // Get total count
      const countResult = await this.db
        .select({ value: count() })
        .from(sentGifts)
        .where(whereCondition!)
      const total = countResult[0]?.value ?? 0

      // Get paginated results with gift type + user info
      const rows = await this.db
        .select({
          id: sentGifts.id,
          giftName: giftTypes.name,
          giftImageUrl: giftTypes.imageUrl,
          tokensCost: sentGifts.tokensCost,
          tokensToReceiver: sentGifts.tokensToReceiver,
          context: sentGifts.context,
          createdAt: sentGifts.createdAt,
          recipientId: sentGifts.receiverId,
          recipientFirstName: receiver.firstName,
          recipientAvatarUrl: receiver.avatarUrl,
          senderId: sentGifts.senderId,
          senderFirstName: sender.firstName,
          senderAvatarUrl: sender.avatarUrl,
        })
        .from(sentGifts)
        .innerJoin(giftTypes, eq(sentGifts.giftTypeId, giftTypes.id))
        .innerJoin(sender, eq(sentGifts.senderId, sender.id))
        .innerJoin(receiver, eq(sentGifts.receiverId, receiver.id))
        .where(whereCondition!)
        .orderBy(desc(sentGifts.createdAt))
        .limit(limit)
        .offset(offset)

      const gifts: GiftHistoryItem[] = rows.map((row) => ({
        id: row.id,
        giftName: row.giftName,
        giftImageUrl: row.giftImageUrl,
        tokensCost: row.tokensCost,
        tokensToReceiver: row.tokensToReceiver,
        context: row.context as GiftContext,
        createdAt: row.createdAt.toISOString(),
        recipientId: row.recipientId,
        recipientFirstName: row.recipientFirstName,
        recipientAvatarUrl: row.recipientAvatarUrl,
        senderId: row.senderId,
        senderFirstName: row.senderFirstName,
        senderAvatarUrl: row.senderAvatarUrl,
      }))

      return { gifts, total, page, limit }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting gift history: user=${userId}`, error)
      throw error
    }
  }
}
