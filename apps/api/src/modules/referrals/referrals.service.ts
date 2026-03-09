import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { referrals } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import { TOKEN_ECONOMY, type ReferralCodeResponse, type ReferralApplyResponse } from '@spark/types'

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Get or generate referral code for a user.
   * Each user gets exactly one unique referral code.
   */
  async getOrCreateCode(userId: string): Promise<ReferralCodeResponse> {
    try {
      // Check if user already has a referral entry
      const [existing] = await this.db
        .select()
        .from(referrals)
        .where(and(eq(referrals.inviterId, userId), eq(referrals.status, 'pending')))
        .limit(1)

      if (existing) {
        return {
          referralCode: existing.referralCode,
          inviterBonus: existing.inviterBonus,
          inviteeBonus: existing.inviteeBonus,
        }
      }

      // Generate human-friendly code: SPARK-XXXXXXXX
      const code = `SPARK-${randomBytes(4).toString('hex').toUpperCase()}`

      const [created] = await this.db
        .insert(referrals)
        .values({
          inviterId: userId,
          referralCode: code,
          inviterBonus: TOKEN_ECONOMY.REFERRAL_BONUS_INVITER,
          inviteeBonus: TOKEN_ECONOMY.REFERRAL_BONUS_INVITEE,
        })
        .returning()

      if (!created) throw new Error('Failed to create referral code')

      this.logger.log(`Referral code created: ${code} for user ${userId}`)

      return {
        referralCode: created.referralCode,
        inviterBonus: created.inviterBonus,
        inviteeBonus: created.inviteeBonus,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to get/create referral code for user ${userId}`, error)
      throw error
    }
  }

  /**
   * Apply a referral code during registration.
   * Credits inviter (200 tokens) and invitee (100 tokens).
   */
  async applyCode(inviteeId: string, referralCode: string): Promise<ReferralApplyResponse> {
    try {
      const [referral] = await this.db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, referralCode.toUpperCase()))
        .limit(1)

      if (!referral) {
        throw new BadRequestException('Invalid referral code')
      }

      if (referral.status !== 'pending') {
        throw new BadRequestException('Referral code has already been used')
      }

      if (referral.inviterId === inviteeId) {
        throw new BadRequestException('Cannot use your own referral code')
      }

      // Mark referral as completed
      await this.db
        .update(referrals)
        .set({
          inviteeId,
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(referrals.id, referral.id))

      // Credit both parties atomically (each creditTokens call is transactional)
      await Promise.all([
        this.walletService.creditTokens(
          referral.inviterId,
          referral.inviterBonus,
          'referral_bonus',
          'Referral bonus: someone joined with your code',
          referral.id,
          'referral',
        ),
        this.walletService.creditTokens(
          inviteeId,
          referral.inviteeBonus,
          'referral_bonus',
          'Welcome bonus: joined with referral code',
          referral.id,
          'referral',
        ),
      ])

      this.logger.log(
        `Referral completed: code=${referralCode}, inviter=${referral.inviterId}, invitee=${inviteeId}`,
      )

      return {
        success: true,
        bonusAwarded: referral.inviteeBonus,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to apply referral code ${referralCode}`, error)
      throw error
    }
  }
}
