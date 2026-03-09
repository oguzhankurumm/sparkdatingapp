import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { and, eq, or, sql, desc, lt, gt, isNull, isNotNull, lte, inArray } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { users, matches, messages, blocks } from '../../database/schema'
import type { Match } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import { TOKEN_ECONOMY, type RematchResponse } from '@spark/types'

const MATCH_EXPIRY_HOURS = 72

export interface MatchWithPartner {
  id: string
  status: 'active' | 'expired' | 'unmatched'
  matchedAt: Date
  expiresAt: Date | null
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

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

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
   * Handle a new message sent in a match:
   * - If this is the FIRST message → set firstMessageAt + nullify expiresAt (match becomes permanent)
   * - Always update lastMessageAt
   */
  async handleMessageSent(matchId: string): Promise<void> {
    try {
      const now = new Date()

      // Check if this match already has a first message
      const [match] = await this.db
        .select({ firstMessageAt: matches.firstMessageAt })
        .from(matches)
        .where(eq(matches.id, matchId))
        .limit(1)

      if (!match) return

      if (!match.firstMessageAt) {
        // First message ever — make match permanent
        await this.db
          .update(matches)
          .set({
            firstMessageAt: now,
            lastMessageAt: now,
            expiresAt: null, // permanent — no longer expires
          })
          .where(eq(matches.id, matchId))

        this.logger.log(`Match ${matchId} made permanent — first message sent`)
      } else {
        // Subsequent message — just update lastMessageAt
        await this.db.update(matches).set({ lastMessageAt: now }).where(eq(matches.id, matchId))
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to handle message sent for match', error)
      throw error
    }
  }

  /**
   * Find all active matches with a non-null expiresAt that has passed.
   * Permanent matches (expiresAt = null) are never expired.
   */
  async getExpiredMatches(): Promise<Match[]> {
    try {
      const now = new Date()

      return this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, 'active'),
            isNotNull(matches.expiresAt),
            lt(matches.expiresAt, now),
          ),
        )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get expired matches', error)
      throw error
    }
  }

  /**
   * Ghost reminders: matches within 24h of expiry, not yet notified.
   * Only non-permanent matches (expiresAt IS NOT NULL).
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
            isNotNull(matches.expiresAt),
            isNull(matches.ghostReminderSentAt),
            lte(matches.expiresAt, twentyFourHoursFromNow),
            gt(matches.expiresAt, now),
          ),
        )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get ghost reminder candidates', error)
      throw error
    }
  }

  /**
   * Urgent reminders: matches within 6h of expiry, not yet notified.
   * Ghost reminder (24h) must already have been sent.
   */
  async getUrgentReminderCandidates(): Promise<Match[]> {
    try {
      const now = new Date()
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000)

      return this.db
        .select()
        .from(matches)
        .where(
          and(
            eq(matches.status, 'active'),
            isNotNull(matches.expiresAt),
            isNull(matches.urgentReminderSentAt),
            isNotNull(matches.ghostReminderSentAt), // 24h already sent
            lte(matches.expiresAt, sixHoursFromNow),
            gt(matches.expiresAt, now),
          ),
        )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get urgent reminder candidates', error)
      throw error
    }
  }

  /**
   * Mark urgent reminders (6h) as sent for the given match IDs.
   */
  async markUrgentReminderSent(matchIds: string[]): Promise<void> {
    if (matchIds.length === 0) return

    try {
      await this.db
        .update(matches)
        .set({ urgentReminderSentAt: new Date() })
        .where(inArray(matches.id, matchIds))

      this.logger.log(`Urgent reminders marked as sent for ${matchIds.length} matches`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to mark urgent reminders as sent', error)
      throw error
    }
  }

  /**
   * Check if two users have an active match.
   * Used by VideoCallsService to determine call flow (direct vs. request-based).
   */
  async isMatched(userId1: string, userId2: string): Promise<boolean> {
    try {
      const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1]
      const [match] = await this.db
        .select({ id: matches.id })
        .from(matches)
        .where(and(eq(matches.user1Id, u1), eq(matches.user2Id, u2), eq(matches.status, 'active')))
        .limit(1)
      return !!match
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to check isMatched', error)
      return false
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

  // ── Anti-Ghosting ──────────────────────────────────────

  /**
   * Mark ghost reminders as sent for the given match IDs.
   * Called by the cron service after dispatching push notifications.
   */
  async markGhostReminderSent(matchIds: string[]): Promise<void> {
    if (matchIds.length === 0) return

    try {
      await this.db
        .update(matches)
        .set({ ghostReminderSentAt: new Date() })
        .where(inArray(matches.id, matchIds))

      this.logger.log(`Ghost reminders marked as sent for ${matchIds.length} matches`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to mark ghost reminders as sent', error)
      throw error
    }
  }

  /**
   * Batch-expire all active matches whose expiresAt has passed.
   * Permanent matches (expiresAt = null) are never expired.
   * Returns expired match rows (for notification dispatch).
   */
  async expireStaleMatches(): Promise<Match[]> {
    try {
      const now = new Date()

      const expired = await this.db
        .update(matches)
        .set({ status: 'expired' })
        .where(
          and(
            eq(matches.status, 'active'),
            isNotNull(matches.expiresAt),
            lt(matches.expiresAt, now),
          ),
        )
        .returning()

      if (expired.length > 0) {
        this.logger.log(`Expired ${expired.length} stale matches`)
      }

      return expired
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to expire stale matches', error)
      throw error
    }
  }

  /**
   * Rematch: reactivate an expired match for 50 tokens.
   * Uses an atomic transaction — token deduction + match reactivation.
   */
  async rematch(matchId: string, userId: string): Promise<RematchResponse> {
    try {
      const [match] = await this.db.select().from(matches).where(eq(matches.id, matchId)).limit(1)

      if (!match) {
        throw new NotFoundException('Match not found')
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        throw new ForbiddenException('You are not part of this match')
      }

      if (match.status !== 'expired') {
        throw new BadRequestException('Only expired matches can be rematched')
      }

      const cost = TOKEN_ECONOMY.REMATCH_COST
      const now = new Date()
      const newExpiresAt = new Date(now.getTime() + MATCH_EXPIRY_HOURS * 60 * 60 * 1000)

      // Atomic: deduct tokens then reactivate match
      await this.walletService.deductTokens(
        userId,
        cost,
        'rematch_purchase',
        `Rematch — reactivated match ${matchId}`,
      )

      const [updated] = await this.db
        .update(matches)
        .set({
          status: 'active',
          expiresAt: newExpiresAt,
          ghostReminderSentAt: null,
          urgentReminderSentAt: null,
          firstMessageAt: null,
        })
        .where(eq(matches.id, matchId))
        .returning()

      if (!updated) {
        throw new Error('Failed to reactivate match')
      }

      this.logger.log(`Match ${matchId} rematched by user ${userId} for ${cost} tokens`)

      return {
        matchId: updated.id,
        newExpiresAt: newExpiresAt.toISOString(),
        tokensCharged: cost,
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to rematch', error)
      throw error
    }
  }
}
