import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq, and, sql, count } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { userBadges, users, matches, walletTransactions, wallets } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import type { BadgeDefinition, BadgeItem, StreakResult } from '@spark/types'

// ── Badge Definitions ──────────────────────────────────────
// Static config — these never change at runtime.
// The DB (userBadges) only stores *earned* instances.

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    badgeId: 'first_match',
    name: 'First Match',
    description: 'Got your very first match',
    category: 'social',
    iconUrl: '/badges/first-match.svg',
    tokenReward: 50,
  },
  {
    badgeId: 'match_10',
    name: 'Popular',
    description: 'Reached 10 matches',
    category: 'social',
    iconUrl: '/badges/match-10.svg',
    tokenReward: 100,
  },
  {
    badgeId: 'match_50',
    name: 'Social Butterfly',
    description: 'Reached 50 matches',
    category: 'social',
    iconUrl: '/badges/match-50.svg',
    tokenReward: 200,
  },
  {
    badgeId: 'first_gift',
    name: 'Generous Heart',
    description: 'Sent your first gift',
    category: 'engagement',
    iconUrl: '/badges/first-gift.svg',
    tokenReward: 50,
  },
  {
    badgeId: 'gifter_100',
    name: 'Big Spender',
    description: 'Sent 100 gifts',
    category: 'engagement',
    iconUrl: '/badges/gifter-100.svg',
    tokenReward: 500,
  },
  {
    badgeId: 'streak_7',
    name: 'Week Warrior',
    description: '7-day login streak',
    category: 'milestone',
    iconUrl: '/badges/streak-7.svg',
    tokenReward: 50,
  },
  {
    badgeId: 'streak_30',
    name: 'Dedicated',
    description: '30-day login streak',
    category: 'milestone',
    iconUrl: '/badges/streak-30.svg',
    tokenReward: 200,
  },
  {
    badgeId: 'streak_100',
    name: 'Unstoppable',
    description: '100-day login streak',
    category: 'milestone',
    iconUrl: '/badges/streak-100.svg',
    tokenReward: 1000,
  },
  {
    badgeId: 'verified',
    name: 'Verified',
    description: 'Completed photo verification',
    category: 'special',
    iconUrl: '/badges/verified.svg',
    tokenReward: 100,
  },
  {
    badgeId: 'first_stream',
    name: 'Broadcaster',
    description: 'Hosted your first live stream',
    category: 'special',
    iconUrl: '/badges/first-stream.svg',
    tokenReward: 100,
  },
]

const BADGE_MAP = new Map(BADGE_DEFINITIONS.map((b) => [b.badgeId, b]))

// ── Streak Milestones ──────────────────────────────────────

const STREAK_MILESTONES = [
  { days: 7, reward: 50 },
  { days: 30, reward: 200 },
  { days: 100, reward: 1000 },
] as const

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  // ── Get All Badge Definitions ──────────────────────────

  getBadgeDefinitions(): BadgeDefinition[] {
    return BADGE_DEFINITIONS
  }

  // ── Get User's Earned Badges ──────────────────────────

  async getUserBadges(userId: string): Promise<BadgeItem[]> {
    try {
      const rows = await this.db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId))
        .orderBy(userBadges.earnedAt)

      return rows.map((row) => ({
        badgeId: row.badgeId,
        name: row.name,
        description: row.description,
        iconUrl: row.iconUrl,
        tokenReward: row.tokenReward,
        isDisplayed: row.isDisplayed,
        earnedAt: row.earnedAt.toISOString(),
      }))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to get badges for user ${userId}`, error)
      throw error
    }
  }

  // ── Toggle Badge Display ──────────────────────────────

  async toggleDisplay(userId: string, badgeId: string, isDisplayed: boolean): Promise<void> {
    await this.db
      .update(userBadges)
      .set({ isDisplayed })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
  }

  // ── Award Badge (Idempotent) ──────────────────────────

  /**
   * Award a badge to a user. Does nothing if already earned.
   * Optionally credits token reward to wallet.
   */
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    const definition = BADGE_MAP.get(badgeId)
    if (!definition) {
      this.logger.warn(`Unknown badge: ${badgeId}`)
      return false
    }

    try {
      // Check if already earned
      const [existing] = await this.db
        .select({ id: userBadges.id })
        .from(userBadges)
        .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
        .limit(1)

      if (existing) return false

      // Insert badge
      await this.db.insert(userBadges).values({
        userId,
        badgeId: definition.badgeId,
        name: definition.name,
        description: definition.description,
        iconUrl: definition.iconUrl,
        tokenReward: definition.tokenReward,
      })

      // Credit token reward
      if (definition.tokenReward > 0) {
        await this.walletService.creditTokens(
          userId,
          definition.tokenReward,
          'badge_reward',
          `Badge earned: ${definition.name}`,
        )
      }

      this.logger.log(
        `Badge awarded: ${badgeId} to user ${userId} (+${definition.tokenReward} tokens)`,
      )
      return true
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to award badge ${badgeId} to user ${userId}`, error)
      return false
    }
  }

  // ── Check and Award Trigger-Based Badges ──────────────

  /**
   * Called after events (match created, gift sent, stream started, etc.)
   * to check if the user has earned any new badges.
   */
  async checkAndAward(userId: string, trigger: string): Promise<void> {
    try {
      switch (trigger) {
        case 'match_created':
          await this.checkMatchBadges(userId)
          break
        case 'gift_sent':
          await this.checkGiftBadges(userId)
          break
        case 'verified':
          await this.awardBadge(userId, 'verified')
          break
        case 'stream_started':
          await this.awardBadge(userId, 'first_stream')
          break
        case 'streak_update':
          await this.checkStreakBadges(userId)
          break
      }
    } catch (error) {
      // Badge awarding should never break the main flow
      Sentry.captureException(error)
      this.logger.error(`Badge check failed for ${trigger} — user ${userId}`, error)
    }
  }

  private async checkMatchBadges(userId: string): Promise<void> {
    const [result] = await this.db
      .select({ total: count() })
      .from(matches)
      .where(
        and(
          eq(matches.status, 'active'),
          sql`(${matches.user1Id} = ${userId} OR ${matches.user2Id} = ${userId})`,
        ),
      )

    const total = Number(result?.total ?? 0)

    if (total >= 1) await this.awardBadge(userId, 'first_match')
    if (total >= 10) await this.awardBadge(userId, 'match_10')
    if (total >= 50) await this.awardBadge(userId, 'match_50')
  }

  private async checkGiftBadges(userId: string): Promise<void> {
    const [result] = await this.db
      .select({ total: count() })
      .from(walletTransactions)
      .innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
      .where(and(eq(wallets.userId, userId), eq(walletTransactions.type, 'gift_sent')))

    const total = Number(result?.total ?? 0)

    if (total >= 1) await this.awardBadge(userId, 'first_gift')
    if (total >= 100) await this.awardBadge(userId, 'gifter_100')
  }

  private async checkStreakBadges(userId: string): Promise<void> {
    const [user] = await this.db
      .select({ currentStreak: users.currentStreak })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) return

    const streak = user.currentStreak

    if (streak >= 7) await this.awardBadge(userId, 'streak_7')
    if (streak >= 30) await this.awardBadge(userId, 'streak_30')
    if (streak >= 100) await this.awardBadge(userId, 'streak_100')
  }

  // ── Daily Streak ──────────────────────────────────────

  /**
   * Record a daily login. Updates streak counters.
   * Returns the current streak status + any milestone bonuses awarded.
   */
  async recordLogin(userId: string): Promise<StreakResult> {
    try {
      const [user] = await this.db
        .select({
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak,
          lastActiveDate: users.lastActiveDate,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) throw new Error(`User not found: ${userId}`)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate.getTime()) : null

      if (lastActive) {
        lastActive.setHours(0, 0, 0, 0)
      }

      // Already logged in today
      if (lastActive && lastActive.getTime() === today.getTime()) {
        return this.buildStreakResult(
          user.currentStreak,
          user.longestStreak,
          user.lastActiveDate,
          true,
        )
      }

      let newStreak: number

      if (lastActive) {
        const diffMs = today.getTime() - lastActive.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        // Consecutive day
        if (diffDays === 1) {
          newStreak = user.currentStreak + 1
        } else {
          // Gap — reset
          newStreak = 1
        }
      } else {
        // First ever login
        newStreak = 1
      }

      const newLongest = Math.max(user.longestStreak, newStreak)

      // Update user record
      await this.db
        .update(users)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: new Date(),
        })
        .where(eq(users.id, userId))

      // Check streak milestone bonuses
      for (const milestone of STREAK_MILESTONES) {
        if (newStreak === milestone.days) {
          await this.walletService.creditTokens(
            userId,
            milestone.reward,
            'streak_bonus',
            `${milestone.days}-day streak bonus`,
          )
          this.logger.log(
            `Streak milestone: user ${userId} hit ${milestone.days} days (+${milestone.reward} tokens)`,
          )
        }
      }

      // Check streak badges
      await this.checkStreakBadges(userId)

      return this.buildStreakResult(newStreak, newLongest, new Date(), false)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to record login for user ${userId}`, error)
      throw error
    }
  }

  private buildStreakResult(
    currentStreak: number,
    longestStreak: number,
    lastActiveDate: Date | null,
    todayRecorded: boolean,
  ): StreakResult {
    // Find next milestone
    const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak) ?? null

    return {
      currentStreak,
      longestStreak,
      lastActiveDate: lastActiveDate?.toISOString() ?? null,
      todayRecorded,
      nextMilestone: nextMilestone?.days ?? null,
      nextMilestoneReward: nextMilestone?.reward ?? null,
    }
  }
}
