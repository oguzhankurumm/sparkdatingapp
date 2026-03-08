import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import { and, eq, or, sql, desc, lt, isNull, lte } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { users, matches, messages, blocks } from '../../database/schema'
import type { Match } from '../../database/schema'

const MATCH_EXPIRY_HOURS = 72

export interface MatchWithPartner {
  id: string
  status: 'active' | 'expired' | 'unmatched'
  matchedAt: Date
  expiresAt: Date
  lastMessageAt: Date | null
  partner: {
    id: string
    firstName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  lastMessage: {
    id: string
    content: string | null
    type: string
    senderId: string
    createdAt: Date
  } | null
  unreadCount: number
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Get all active matches for a user with partner info, last message, and unread count.
   * Filters out matches where either user has blocked the other.
   * Ordered by lastMessageAt DESC (most recent conversations first).
   */
  async getMatches(userId: string): Promise<MatchWithPartner[]> {
    try {
      // Get all blocked user IDs (both directions)
      const blockedRows = await this.db
        .select({
          blockerId: blocks.blockerId,
          blockedId: blocks.blockedId,
        })
        .from(blocks)
        .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)))

      const blockedUserIds = new Set(
        blockedRows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId)),
      )

      // Get all active matches for this user
      const matchRows = await this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, 'active'),
            or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          ),
        )
        .orderBy(desc(sql`COALESCE(${matches.lastMessageAt}, ${matches.matchedAt})`))

      if (matchRows.length === 0) {
        return []
      }

      // Build the result with partner info and last message
      const result: MatchWithPartner[] = []

      for (const match of matchRows) {
        const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id

        // Skip blocked users
        if (blockedUserIds.has(partnerId)) {
          continue
        }

        // Get partner info
        const [partner] = await this.db
          .select({
            id: users.id,
            firstName: users.firstName,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified,
          })
          .from(users)
          .where(eq(users.id, partnerId))
          .limit(1)

        if (!partner) continue

        // Get last message for this match
        const [lastMessage] = await this.db
          .select({
            id: messages.id,
            content: messages.content,
            type: messages.type,
            senderId: messages.senderId,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(and(eq(messages.matchId, match.id), eq(messages.isDeleted, false)))
          .orderBy(desc(messages.createdAt))
          .limit(1)

        // Get unread count (messages from the partner that user hasn't read)
        const [unreadResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.matchId, match.id),
              eq(messages.senderId, partnerId),
              eq(messages.isRead, false),
              eq(messages.isDeleted, false),
            ),
          )

        result.push({
          id: match.id,
          status: match.status,
          matchedAt: match.matchedAt,
          expiresAt: match.expiresAt,
          lastMessageAt: match.lastMessageAt,
          partner,
          lastMessage: lastMessage ?? null,
          unreadCount: unreadResult?.count ?? 0,
        })
      }

      return result
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get matches', error)
      throw error
    }
  }

  /**
   * Get a single match by ID. Verifies the requesting user is part of the match.
   */
  async getMatchById(matchId: string, userId: string): Promise<Match> {
    try {
      const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

      if (!match) {
        throw new NotFoundException('Match not found')
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new ForbiddenException('You are not part of this match')
      }

      return match
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to get match by ID', error)
      throw error
    }
  }

  /**
   * Create a new match when a mutual like is detected.
   * Sets expiresAt = now + 72 hours.
   * Always stores the lower UUID as user1Id for consistency with the unique index.
   */
  async createMatchFromLike(senderId: string, receiverId: string): Promise<Match> {
    try {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + MATCH_EXPIRY_HOURS * 60 * 60 * 1000)

      // Consistent ordering for the unique index
      const [u1, u2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId]

      const [match] = await this.db
        .insert(matches)
        .values({
          user1Id: u1,
          user2Id: u2,
          status: 'active',
          expiresAt,
          matchedAt: now,
        })
        .returning()

      if (!match) {
        throw new Error('Failed to create match')
      }

      this.logger.log(`Match created: ${match.id} between ${u1} and ${u2}`)

      return match
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to create match from like', error)
      throw error
    }
  }

  /**
   * Unmatch: set status to 'unmatched' and record unmatchedAt timestamp.
   * Validates the requesting user is part of the match.
   */
  async unmatch(matchId: string, userId: string): Promise<Match> {
    try {
      // Verify user is part of the match
      const match = await this.getMatchById(matchId, userId)

      if (match.status !== 'active') {
        throw new ForbiddenException('Match is not active')
      }

      const now = new Date()

      const [updated] = await this.db
        .update(matches)
        .set({
          status: 'unmatched',
          unmatchedAt: now,
        })
        .where(eq(matches.id, matchId))
        .returning()

      if (!updated) {
        throw new Error('Failed to unmatch')
      }

      this.logger.log(`Match ${matchId} unmatched by user ${userId}`)

      return updated
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to unmatch', error)
      throw error
    }
  }

  /**
   * Extend match expiry: reset expiresAt to lastMessageAt + 72h.
   * Called whenever a new message is sent in the match.
   */
  async extendExpiry(matchId: string): Promise<void> {
    try {
      const now = new Date()
      const newExpiry = new Date(now.getTime() + MATCH_EXPIRY_HOURS * 60 * 60 * 1000)

      await this.db
        .update(matches)
        .set({
          expiresAt: newExpiry,
          lastMessageAt: now,
        })
        .where(eq(matches.id, matchId))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to extend match expiry', error)
      throw error
    }
  }

  /**
   * Find all matches that have passed their expiresAt — for cron-based cleanup.
   * Only returns active matches (not already expired or unmatched).
   */
  async getExpiredMatches(): Promise<Match[]> {
    try {
      const now = new Date()

      return this.db
        .select()
        .from(matches)
        .where(and(eq(matches.status, 'active'), lt(matches.expiresAt, now)))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get expired matches', error)
      throw error
    }
  }

  /**
   * Find matches that are candidates for ghost reminders:
   * - Active matches
   * - expiresAt is within the next 24 hours (i.e., only 24h left)
   * - ghostReminderSentAt is null (reminder not yet sent)
   */
  async getGhostReminderCandidates(): Promise<Match[]> {
    try {
      const now = new Date()
      const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      return this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, 'active'),
            isNull(matches.ghostReminderSentAt),
            lte(matches.expiresAt, twentyFourHoursFromNow),
            // Still active — not yet expired
            sql`${matches.expiresAt} > ${now}`,
          ),
        )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get ghost reminder candidates', error)
      throw error
    }
  }

  /**
   * Verify that a user is part of a specific match and the match is active.
   * Used by MessagingService before sending/reading messages.
   */
  async verifyMatchAccess(matchId: string, userId: string): Promise<Match> {
    const match = await this.getMatchById(matchId, userId)

    if (match.status !== 'active') {
      throw new ForbiddenException('Cannot access messages for an inactive match')
    }

    return match
  }
}
