import { Inject, Injectable, Logger } from '@nestjs/common'
import { eq, and, sql, desc, gte, lt } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import {
  leaderboardSnapshots,
  users,
  matches,
  walletTransactions,
  wallets,
  liveStreams,
} from '../../database/schema'
import type { LeaderboardCategory, LeaderboardEntry, LeaderboardResponse } from '@spark/types'

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // ── Get Leaderboard ──────────────────────────────────────

  /**
   * Fetch the leaderboard for a given category and current week.
   * Falls back to live query if no snapshot exists yet.
   */
  async getLeaderboard(
    category: LeaderboardCategory,
    userId: string,
  ): Promise<LeaderboardResponse> {
    try {
      const weekStart = this.getWeekStart()

      // Try snapshot first (fast path)
      const snapshots = await this.db
        .select({
          rank: leaderboardSnapshots.rank,
          userId: leaderboardSnapshots.userId,
          score: leaderboardSnapshots.score,
        })
        .from(leaderboardSnapshots)
        .where(
          and(
            eq(leaderboardSnapshots.category, category),
            eq(leaderboardSnapshots.weekStart, weekStart),
          ),
        )
        .orderBy(leaderboardSnapshots.rank)
        .limit(50)

      let entries: LeaderboardEntry[]
      let myRank: number | null = null
      let myScore: number | null = null

      if (snapshots.length > 0) {
        // Hydrate with user info
        const userIds = snapshots.map((s) => s.userId)
        const userRows = await this.db
          .select({
            id: users.id,
            firstName: users.firstName,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified,
          })
          .from(users)
          .where(sql`${users.id} IN ${userIds}`)

        const userMap = new Map(userRows.map((u) => [u.id, u]))

        entries = snapshots.map((s) => {
          const user = userMap.get(s.userId)
          return {
            rank: s.rank,
            userId: s.userId,
            firstName: user?.firstName ?? 'Unknown',
            avatarUrl: user?.avatarUrl ?? null,
            isVerified: user?.isVerified ?? false,
            score: s.score,
          }
        })

        // Find user's own rank
        const mySnapshot = snapshots.find((s) => s.userId === userId)
        if (mySnapshot) {
          myRank = mySnapshot.rank
          myScore = mySnapshot.score
        } else {
          // Check if user is outside top 50
          const [userEntry] = await this.db
            .select({
              rank: leaderboardSnapshots.rank,
              score: leaderboardSnapshots.score,
            })
            .from(leaderboardSnapshots)
            .where(
              and(
                eq(leaderboardSnapshots.category, category),
                eq(leaderboardSnapshots.weekStart, weekStart),
                eq(leaderboardSnapshots.userId, userId),
              ),
            )
            .limit(1)

          if (userEntry) {
            myRank = userEntry.rank
            myScore = userEntry.score
          }
        }
      } else {
        // No snapshot — compute live
        const result = await this.computeLiveRanking(category, weekStart, userId)
        entries = result.entries
        myRank = result.myRank
        myScore = result.myScore
      }

      return {
        category,
        weekStart: weekStart.toISOString(),
        entries,
        myRank,
        myScore,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to get leaderboard: ${category}`, error)
      throw error
    }
  }

  // ── Generate Weekly Snapshot (Cron) ──────────────────────

  /**
   * Called by cron job (e.g. every Monday at 00:05 UTC)
   * to snapshot the previous week's leaderboard.
   */
  async generateWeeklySnapshot(): Promise<void> {
    const weekStart = this.getWeekStart()
    const categories: LeaderboardCategory[] = ['gifters', 'streamers', 'matchers', 'streakers']

    for (const category of categories) {
      try {
        // Delete existing snapshot for this week+category (idempotent)
        await this.db
          .delete(leaderboardSnapshots)
          .where(
            and(
              eq(leaderboardSnapshots.category, category),
              eq(leaderboardSnapshots.weekStart, weekStart),
            ),
          )

        const scores = await this.computeScores(category, weekStart)

        if (scores.length === 0) continue

        // Insert ranked snapshots
        const values = scores.map((s, i) => ({
          userId: s.userId,
          category,
          rank: i + 1,
          score: s.score,
          weekStart,
        }))

        await this.db.insert(leaderboardSnapshots).values(values)

        this.logger.log(`Snapshot generated: ${category} — ${scores.length} entries`)
      } catch (error) {
        Sentry.captureException(error)
        this.logger.error(`Failed to generate snapshot for ${category}`, error)
      }
    }
  }

  // ── Private Helpers ──────────────────────────────────────

  private async computeScores(
    category: LeaderboardCategory,
    weekStart: Date,
  ): Promise<{ userId: string; score: number }[]> {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    switch (category) {
      case 'gifters':
        return this.computeGifterScores(weekStart, weekEnd)
      case 'streamers':
        return this.computeStreamerScores(weekStart, weekEnd)
      case 'matchers':
        return this.computeMatcherScores(weekStart, weekEnd)
      case 'streakers':
        return this.computeStreakScores()
      default:
        return []
    }
  }

  private async computeGifterScores(
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ userId: string; score: number }[]> {
    const rows = await this.db
      .select({
        userId: wallets.userId,
        score: sql<number>`coalesce(sum(abs(${walletTransactions.amount})), 0)`,
      })
      .from(walletTransactions)
      .innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
      .where(
        and(
          eq(walletTransactions.type, 'gift_sent'),
          gte(walletTransactions.createdAt, weekStart),
          lt(walletTransactions.createdAt, weekEnd),
        ),
      )
      .groupBy(wallets.userId)
      .orderBy(desc(sql`score`))
      .limit(100)

    return rows.map((r) => ({ userId: r.userId, score: Number(r.score) }))
  }

  private async computeStreamerScores(
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ userId: string; score: number }[]> {
    const rows = await this.db
      .select({
        userId: liveStreams.hostId,
        score: sql<number>`coalesce(sum(${liveStreams.totalTokensEarned}), 0)`,
      })
      .from(liveStreams)
      .where(and(gte(liveStreams.startedAt, weekStart), lt(liveStreams.startedAt, weekEnd)))
      .groupBy(liveStreams.hostId)
      .orderBy(desc(sql`score`))
      .limit(100)

    return rows.map((r) => ({ userId: r.userId, score: Number(r.score) }))
  }

  private async computeMatcherScores(
    weekStart: Date,
    weekEnd: Date,
  ): Promise<{ userId: string; score: number }[]> {
    // Count matches created in this week, per user (either side)
    const rows = await this.db
      .select({
        userId: sql<string>`u.id`,
        score: sql<number>`count(*)`,
      })
      .from(
        sql`(
        SELECT ${matches.user1Id} AS uid, ${matches.matchedAt} AS matched_at FROM ${matches}
        WHERE ${matches.status} = 'active'
          AND ${matches.matchedAt} >= ${weekStart}
          AND ${matches.matchedAt} < ${weekEnd}
        UNION ALL
        SELECT ${matches.user2Id} AS uid, ${matches.matchedAt} AS matched_at FROM ${matches}
        WHERE ${matches.status} = 'active'
          AND ${matches.matchedAt} >= ${weekStart}
          AND ${matches.matchedAt} < ${weekEnd}
      ) AS m INNER JOIN ${users} AS u ON u.id = m.uid`,
      )
      .groupBy(sql`u.id`)
      .orderBy(desc(sql`score`))
      .limit(100)

    return rows.map((r) => ({ userId: String(r.userId), score: Number(r.score) }))
  }

  private async computeStreakScores(): Promise<{ userId: string; score: number }[]> {
    // Streak is a point-in-time metric — just rank by currentStreak
    const rows = await this.db
      .select({
        userId: users.id,
        score: users.currentStreak,
      })
      .from(users)
      .where(sql`${users.currentStreak} > 0`)
      .orderBy(desc(users.currentStreak))
      .limit(100)

    return rows.map((r) => ({ userId: r.userId, score: r.score }))
  }

  private async computeLiveRanking(
    category: LeaderboardCategory,
    weekStart: Date,
    userId: string,
  ): Promise<{ entries: LeaderboardEntry[]; myRank: number | null; myScore: number | null }> {
    const scores = await this.computeScores(category, weekStart)

    // Hydrate top 50
    const top50 = scores.slice(0, 50)
    const userIds = top50.map((s) => s.userId)

    let userMap = new Map<
      string,
      { firstName: string; avatarUrl: string | null; isVerified: boolean }
    >()

    if (userIds.length > 0) {
      const userRows = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
        })
        .from(users)
        .where(sql`${users.id} IN ${userIds}`)

      userMap = new Map(userRows.map((u) => [u.id, u]))
    }

    const entries: LeaderboardEntry[] = top50.map((s, i) => {
      const user = userMap.get(s.userId)
      return {
        rank: i + 1,
        userId: s.userId,
        firstName: user?.firstName ?? 'Unknown',
        avatarUrl: user?.avatarUrl ?? null,
        isVerified: user?.isVerified ?? false,
        score: s.score,
      }
    })

    // Find user's own rank
    const myIdx = scores.findIndex((s) => s.userId === userId)
    const myRank = myIdx >= 0 ? myIdx + 1 : null
    const myScore = myIdx >= 0 ? scores[myIdx]!.score : null

    return { entries, myRank, myScore }
  }

  private getWeekStart(): Date {
    const now = new Date()
    const day = now.getUTCDay()
    // Monday = 1, Sunday = 0 → shift to Monday-based
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setUTCDate(now.getUTCDate() - diff)
    monday.setUTCHours(0, 0, 0, 0)
    return monday
  }
}
