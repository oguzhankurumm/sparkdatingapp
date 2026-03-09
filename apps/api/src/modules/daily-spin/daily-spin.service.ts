import { Inject, Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common'
import { and, eq, gte, desc } from 'drizzle-orm'
import * as crypto from 'node:crypto'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { dailySpins } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'

// ── Reward Configuration ─────────────────────────────────

export interface SpinReward {
  type: 'tokens' | 'super_like' | 'boost_1d' | 'gift_item'
  amount: number
  label: string
  emoji: string
  probability: number // 0–1, all probabilities must sum to 1
}

/**
 * Weighted reward table — probabilities sum to 1.0.
 * Server-side seeded random ensures fair distribution and prevents client manipulation.
 */
const REWARD_TABLE: SpinReward[] = [
  { type: 'tokens', amount: 50, label: '50 Tokens', emoji: '🌟', probability: 0.3 },
  { type: 'tokens', amount: 100, label: '100 Tokens', emoji: '⭐', probability: 0.25 },
  { type: 'tokens', amount: 200, label: '200 Tokens', emoji: '💎', probability: 0.2 },
  { type: 'gift_item', amount: 1, label: 'Special Gift', emoji: '🎁', probability: 0.1 },
  { type: 'super_like', amount: 1, label: '1 Super Like', emoji: '🔥', probability: 0.08 },
  { type: 'tokens', amount: 500, label: '500 Tokens', emoji: '👑', probability: 0.05 },
  { type: 'boost_1d', amount: 1, label: '1-Day Boost', emoji: '🚀', probability: 0.02 },
]

const MAX_FREE_SPINS_PER_DAY = 1
const MAX_AD_SPINS_PER_DAY = 3

export interface SpinResult {
  reward: SpinReward
  spinId: string
  remainingFreeSpins: number
  remainingAdSpins: number
}

export interface SpinStatus {
  freeSpinsRemaining: number
  adSpinsRemaining: number
  lastSpinAt: string | null
  todayRewards: Array<{
    type: string
    amount: number
    label: string
    source: string
    spunAt: string
  }>
}

@Injectable()
export class DailySpinService {
  private readonly logger = new Logger(DailySpinService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Get the user's spin status for today: remaining spins and today's rewards.
   */
  async getSpinStatus(userId: string): Promise<SpinStatus> {
    try {
      const todayStart = this.getTodayStart()
      const { freeCount, adCount, todaySpins } = await this.getTodaySpinCounts(userId, todayStart)

      const lastSpin = todaySpins.length > 0 ? todaySpins[0] : null

      return {
        freeSpinsRemaining: Math.max(0, MAX_FREE_SPINS_PER_DAY - freeCount),
        adSpinsRemaining: Math.max(0, MAX_AD_SPINS_PER_DAY - adCount),
        lastSpinAt: lastSpin?.createdAt?.toISOString() ?? null,
        todayRewards: todaySpins.map((s) => ({
          type: s.rewardType,
          amount: s.rewardAmount,
          label: s.rewardLabel ?? '',
          source: s.source,
          spunAt: s.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get spin status', error)
      throw error
    }
  }

  /**
   * Execute a free daily spin.
   * 1 free spin per day, server-side seeded random, immediate reward.
   */
  async spinFree(userId: string): Promise<SpinResult> {
    try {
      const todayStart = this.getTodayStart()
      const { freeCount, adCount } = await this.getTodaySpinCounts(userId, todayStart)

      if (freeCount >= MAX_FREE_SPINS_PER_DAY) {
        throw new BadRequestException('Free daily spin already used. Watch an ad for extra spins!')
      }

      return this.executeSpin(userId, 'free', freeCount + 1, adCount)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to execute free spin', error)
      throw error
    }
  }

  /**
   * Execute an ad-reward spin.
   * Max 3 ad spins per day. Requires ad verification token.
   */
  async spinAd(userId: string, adVerificationToken: string): Promise<SpinResult> {
    try {
      if (!adVerificationToken || adVerificationToken.length < 10) {
        throw new ForbiddenException('Invalid ad verification token')
      }

      const todayStart = this.getTodayStart()
      const { freeCount, adCount } = await this.getTodaySpinCounts(userId, todayStart)

      if (adCount >= MAX_AD_SPINS_PER_DAY) {
        throw new BadRequestException('Maximum ad spins reached for today (3/3)')
      }

      return this.executeSpin(userId, 'ad', freeCount, adCount + 1, adVerificationToken)
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to execute ad spin', error)
      throw error
    }
  }

  /**
   * Get the reward table configuration (for frontend wheel rendering).
   */
  getRewardTable(): SpinReward[] {
    return REWARD_TABLE.map((r) => ({
      type: r.type,
      amount: r.amount,
      label: r.label,
      emoji: r.emoji,
      probability: r.probability,
    }))
  }

  // ── Private Helpers ──────────────────────────────────

  /**
   * Core spin execution: seeded random → pick reward → distribute → record.
   */
  private async executeSpin(
    userId: string,
    source: 'free' | 'ad',
    newFreeCount: number,
    newAdCount: number,
    adVerificationToken?: string,
  ): Promise<SpinResult> {
    // Generate server-side seed for fairness + audit
    const serverSeed = crypto.randomBytes(32).toString('hex')
    const reward = this.pickReward(serverSeed)

    // Record the spin
    const [spin] = await this.db
      .insert(dailySpins)
      .values({
        userId,
        rewardType: reward.type,
        rewardAmount: reward.amount,
        rewardLabel: reward.label,
        source,
        serverSeed,
        adVerificationToken: adVerificationToken ?? null,
      })
      .returning()

    if (!spin) {
      throw new Error('Failed to record daily spin')
    }

    // Distribute the reward
    await this.distributeReward(userId, reward, spin.id)

    this.logger.log(`User ${userId} spun (${source}): ${reward.emoji} ${reward.label}`)

    return {
      reward,
      spinId: spin.id,
      remainingFreeSpins: Math.max(0, MAX_FREE_SPINS_PER_DAY - newFreeCount),
      remainingAdSpins: Math.max(0, MAX_AD_SPINS_PER_DAY - newAdCount),
    }
  }

  /**
   * Pick a reward using seeded randomness — deterministic from server seed.
   * Uses HMAC-SHA256 to generate a float in [0, 1) from the seed.
   */
  private pickReward(serverSeed: string): SpinReward {
    const hash = crypto.createHmac('sha256', serverSeed).update('daily-spin').digest('hex')
    const randomValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff

    let cumulative = 0
    for (const reward of REWARD_TABLE) {
      cumulative += reward.probability
      if (randomValue < cumulative) {
        return reward
      }
    }

    // Fallback: return the first reward (should never reach here)
    return REWARD_TABLE[0]!
  }

  /**
   * Distribute the reward to the user's account.
   * Token rewards go through WalletService; others are tracked for frontend action.
   */
  private async distributeReward(
    userId: string,
    reward: SpinReward,
    spinId: string,
  ): Promise<void> {
    switch (reward.type) {
      case 'tokens':
        await this.walletService.creditTokens(
          userId,
          reward.amount,
          'daily_spin',
          `Daily Spin reward: ${reward.label}`,
          spinId,
          'daily_spin',
        )
        break

      case 'super_like':
        // TODO: Integrate with DiscoveryService.addSuperLikes() when available
        // For now, credit token-equivalent value (150 tokens per super like)
        await this.walletService.creditTokens(
          userId,
          150,
          'daily_spin',
          `Daily Spin reward: ${reward.label} (150 token equivalent)`,
          spinId,
          'daily_spin',
        )
        break

      case 'boost_1d':
        // TODO: Integrate with BoostService.grantFreeBoost() when available
        // For now, credit token-equivalent value (500 tokens for 1-day boost)
        await this.walletService.creditTokens(
          userId,
          500,
          'daily_spin',
          `Daily Spin reward: ${reward.label} (500 token equivalent)`,
          spinId,
          'daily_spin',
        )
        break

      case 'gift_item':
        // TODO: Integrate with GiftsService.grantRandomGift() when available
        // For now, credit token-equivalent value (200 tokens)
        await this.walletService.creditTokens(
          userId,
          200,
          'daily_spin',
          `Daily Spin reward: ${reward.label} (200 token equivalent)`,
          spinId,
          'daily_spin',
        )
        break

      default:
        this.logger.warn(`Unknown reward type: ${reward.type}`)
    }
  }

  /**
   * Count today's spins by source (free vs ad).
   */
  private async getTodaySpinCounts(userId: string, todayStart: Date) {
    const todaySpins = await this.db
      .select()
      .from(dailySpins)
      .where(and(eq(dailySpins.userId, userId), gte(dailySpins.createdAt, todayStart)))
      .orderBy(desc(dailySpins.createdAt))

    const freeCount = todaySpins.filter((s) => s.source === 'free').length
    const adCount = todaySpins.filter((s) => s.source === 'ad').length

    return { freeCount, adCount, todaySpins }
  }

  /**
   * Get the start of today (midnight UTC).
   */
  private getTodayStart(): Date {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  }
}
