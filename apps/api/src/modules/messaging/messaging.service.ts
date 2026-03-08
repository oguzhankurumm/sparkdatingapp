import { Inject, Injectable, Logger, ForbiddenException } from '@nestjs/common'
import { and, eq, desc, lt, sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { messages, matches } from '../../database/schema'
import type { Message } from '../../database/schema'
import type { MatchingService } from '../matching/matching.service'
import type { SendMessageInput } from './dto'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

export interface PaginatedMessages {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Get paginated messages for a match.
   * Verifies the user is part of the match and the match is active.
   * Returns messages ordered by createdAt DESC with cursor-based pagination.
   */
  async getMessages(
    matchId: string,
    userId: string,
    cursor?: string,
    limit?: number,
  ): Promise<PaginatedMessages> {
    try {
      // Verify user has access to this match
      await this.matchingService.verifyMatchAccess(matchId, userId)

      const pageSize = Math.min(limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

      const conditions = [eq(messages.matchId, matchId), eq(messages.isDeleted, false)]

      // Cursor-based pagination: fetch messages older than the cursor timestamp
      if (cursor) {
        const cursorDate = new Date(cursor)
        conditions.push(lt(messages.createdAt, cursorDate))
      }

      const rows = await this.db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(pageSize + 1)

      const hasMore = rows.length > pageSize
      const sliced = rows.slice(0, pageSize)

      const lastMessage = sliced[sliced.length - 1]
      const nextCursor = hasMore && lastMessage ? lastMessage.createdAt.toISOString() : null

      return {
        messages: sliced,
        nextCursor,
        hasMore,
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to get messages', error)
      throw error
    }
  }

  /**
   * Send a new message in a match.
   * Verifies match access, creates the message, and extends match expiry.
   * Uses a database transaction to ensure atomicity.
   */
  async sendMessage(matchId: string, senderId: string, data: SendMessageInput): Promise<Message> {
    try {
      // Verify user has access and match is active
      await this.matchingService.verifyMatchAccess(matchId, senderId)

      const [message] = await this.db.transaction(async (tx) => {
        // Insert the message
        const [newMessage] = await tx
          .insert(messages)
          .values({
            matchId,
            senderId,
            type: data.type,
            content: data.content ?? null,
            mediaUrl: data.mediaUrl ?? null,
          })
          .returning()

        if (!newMessage) {
          throw new Error('Failed to create message')
        }

        // Update match: lastMessageAt + extend expiry (72h from now)
        const now = new Date()
        const newExpiry = new Date(now.getTime() + 72 * 60 * 60 * 1000)

        await tx
          .update(matches)
          .set({
            lastMessageAt: now,
            expiresAt: newExpiry,
          })
          .where(eq(matches.id, matchId))

        return [newMessage]
      })

      if (!message) {
        throw new Error('Failed to create message')
      }

      this.logger.log(`Message sent in match ${matchId} by user ${senderId}`)

      return message
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to send message', error)
      throw error
    }
  }

  /**
   * Mark all unread messages from the other user as read.
   * Sets isRead = true and readAt = now for all unread messages
   * sent by the partner (not the current user).
   */
  async markAsRead(matchId: string, userId: string): Promise<{ markedCount: number }> {
    try {
      // Verify match access
      const match = await this.matchingService.verifyMatchAccess(matchId, userId)

      // The "other" user is the one who sent messages we need to mark as read
      const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id

      const now = new Date()

      const updated = await this.db
        .update(messages)
        .set({
          isRead: true,
          readAt: now,
        })
        .where(
          and(
            eq(messages.matchId, matchId),
            eq(messages.senderId, partnerId),
            eq(messages.isRead, false),
            eq(messages.isDeleted, false),
          ),
        )
        .returning({ id: messages.id })

      return { markedCount: updated.length }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to mark messages as read', error)
      throw error
    }
  }

  /**
   * Get total unread message count across all active matches for a user.
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    try {
      const [result] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .innerJoin(matches, eq(messages.matchId, matches.id))
        .where(
          and(
            eq(matches.status, 'active'),
            // User is part of the match
            sql`(${matches.user1Id} = ${userId} OR ${matches.user2Id} = ${userId})`,
            // Messages from the other user (not sent by current user)
            sql`${messages.senderId} != ${userId}`,
            eq(messages.isRead, false),
            eq(messages.isDeleted, false),
          ),
        )

      return { unreadCount: result?.count ?? 0 }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get unread count', error)
      throw error
    }
  }
}
