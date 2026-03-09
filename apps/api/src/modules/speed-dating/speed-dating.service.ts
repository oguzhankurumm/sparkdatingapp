import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { eq, and, desc, sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import {
  speedDatingEvents,
  speedDatingParticipants,
  speedDatingLikes,
  type SpeedDatingEvent,
} from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import type { MatchingService } from '../matching/matching.service'

@Injectable()
export class SpeedDatingService {
  private readonly logger = new Logger(SpeedDatingService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * List upcoming / active events.
   */
  async listEvents(status?: 'scheduled' | 'active'): Promise<
    {
      id: string
      title: string
      description: string | null
      status: string
      maxParticipants: number
      currentParticipants: number
      roundDurationSeconds: number
      totalRounds: number
      tokenCost: number
      scheduledAt: string
    }[]
  > {
    try {
      const query = this.db.select().from(speedDatingEvents)

      const rows = status
        ? await query
            .where(eq(speedDatingEvents.status, status))
            .orderBy(speedDatingEvents.scheduledAt)
            .limit(20)
        : await query.orderBy(desc(speedDatingEvents.scheduledAt)).limit(20)

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        maxParticipants: r.maxParticipants,
        currentParticipants: r.currentParticipants,
        roundDurationSeconds: r.roundDurationSeconds,
        totalRounds: r.totalRounds,
        tokenCost: r.tokenCost,
        scheduledAt: r.scheduledAt.toISOString(),
      }))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error listing speed-dating events', error)
      throw error
    }
  }

  /**
   * Get a single event by ID.
   */
  async getEvent(eventId: string): Promise<SpeedDatingEvent> {
    const [event] = await this.db
      .select()
      .from(speedDatingEvents)
      .where(eq(speedDatingEvents.id, eventId))
      .limit(1)

    if (!event) throw new NotFoundException('Speed-dating event not found')
    return event
  }

  /**
   * Join a speed-dating event. Deducts token cost from wallet.
   */
  async joinEvent(
    userId: string,
    eventId: string,
  ): Promise<{ participantId: string; eventId: string }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'scheduled') {
        throw new BadRequestException('Event is not open for registration')
      }

      if (event.currentParticipants >= event.maxParticipants) {
        throw new BadRequestException('Event is full')
      }

      // Check if already joined
      const [existing] = await this.db
        .select()
        .from(speedDatingParticipants)
        .where(
          and(
            eq(speedDatingParticipants.eventId, eventId),
            eq(speedDatingParticipants.userId, userId),
            eq(speedDatingParticipants.isActive, true),
          ),
        )
        .limit(1)

      if (existing) {
        throw new BadRequestException('You have already joined this event')
      }

      // Deduct tokens
      if (event.tokenCost > 0) {
        await this.walletService.deductTokens(
          userId,
          event.tokenCost,
          'speed_dating_join',
          `Speed-dating entry: ${event.title}`,
          eventId,
          'speed_dating_event',
        )
      }

      // Add participant
      const [participant] = await this.db
        .insert(speedDatingParticipants)
        .values({ eventId, userId })
        .returning()

      if (!participant) throw new Error('Failed to add participant')

      // Increment count
      await this.db
        .update(speedDatingEvents)
        .set({ currentParticipants: sql`${speedDatingEvents.currentParticipants} + 1` })
        .where(eq(speedDatingEvents.id, eventId))

      this.logger.log(`User ${userId} joined speed-dating event ${eventId}`)

      return { participantId: participant.id, eventId }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error joining speed-dating event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Leave a speed-dating event (only before it starts).
   */
  async leaveEvent(userId: string, eventId: string): Promise<{ left: boolean }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'scheduled') {
        throw new BadRequestException('Cannot leave an event that has already started')
      }

      const [participant] = await this.db
        .select()
        .from(speedDatingParticipants)
        .where(
          and(
            eq(speedDatingParticipants.eventId, eventId),
            eq(speedDatingParticipants.userId, userId),
            eq(speedDatingParticipants.isActive, true),
          ),
        )
        .limit(1)

      if (!participant) {
        throw new NotFoundException('You are not in this event')
      }

      await this.db
        .update(speedDatingParticipants)
        .set({ isActive: false, leftAt: new Date() })
        .where(eq(speedDatingParticipants.id, participant.id))

      await this.db
        .update(speedDatingEvents)
        .set({ currentParticipants: sql`${speedDatingEvents.currentParticipants} - 1` })
        .where(eq(speedDatingEvents.id, eventId))

      this.logger.log(`User ${userId} left speed-dating event ${eventId}`)

      return { left: true }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error leaving speed-dating event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Generate round-robin pairings for a given round.
   * Classic round-robin: fix participant[0], rotate the rest.
   * Returns array of [userId1, userId2] pairs.
   */
  generatePairings(participantUserIds: string[], round: number): [string, string][] {
    const n = participantUserIds.length
    if (n < 2) return []

    // For odd number of participants, add a "bye" sentinel
    const ids = [...participantUserIds]
    if (n % 2 !== 0) ids.push('__bye__')

    const total = ids.length
    const pairs: [string, string][] = []

    // Round-robin rotation: fix first element, rotate the rest
    const rotated = [ids[0]!]
    const rest = ids.slice(1)
    const shift = round % (total - 1)
    for (let i = 0; i < rest.length; i++) {
      rotated.push(rest[(i + shift) % rest.length]!)
    }

    // Pair: first with last, second with second-to-last, etc.
    const half = total / 2
    for (let i = 0; i < half; i++) {
      const a = rotated[i]!
      const b = rotated[total - 1 - i]!
      if (a !== '__bye__' && b !== '__bye__') {
        pairs.push([a, b])
      }
    }

    return pairs
  }

  /**
   * Get pairings for the current round of an active event.
   */
  async getCurrentPairings(eventId: string): Promise<{
    round: number
    pairings: { user1Id: string; user2Id: string }[]
  }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'active') {
        throw new BadRequestException('Event is not active')
      }

      const participants = await this.db
        .select()
        .from(speedDatingParticipants)
        .where(
          and(
            eq(speedDatingParticipants.eventId, eventId),
            eq(speedDatingParticipants.isActive, true),
          ),
        )

      const userIds = participants.map((p) => p.userId)
      const pairs = this.generatePairings(userIds, event.currentRound)

      return {
        round: event.currentRound,
        pairings: pairs.map(([a, b]) => ({ user1Id: a, user2Id: b })),
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error getting pairings for event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Submit a like for a partner in the current round.
   */
  async submitLike(
    userId: string,
    eventId: string,
    targetUserId: string,
  ): Promise<{ liked: boolean }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'active') {
        throw new BadRequestException('Event is not active')
      }

      // Verify both users are active participants
      const participants = await this.db
        .select()
        .from(speedDatingParticipants)
        .where(
          and(
            eq(speedDatingParticipants.eventId, eventId),
            eq(speedDatingParticipants.isActive, true),
          ),
        )

      const participantIds = participants.map((p) => p.userId)
      if (!participantIds.includes(userId)) {
        throw new ForbiddenException('You are not a participant in this event')
      }
      if (!participantIds.includes(targetUserId)) {
        throw new BadRequestException('Target user is not a participant')
      }

      // Check if already liked this person in this round
      const [existingLike] = await this.db
        .select()
        .from(speedDatingLikes)
        .where(
          and(
            eq(speedDatingLikes.eventId, eventId),
            eq(speedDatingLikes.fromUserId, userId),
            eq(speedDatingLikes.toUserId, targetUserId),
            eq(speedDatingLikes.round, event.currentRound),
          ),
        )
        .limit(1)

      if (existingLike) {
        throw new BadRequestException('You already liked this person in this round')
      }

      await this.db.insert(speedDatingLikes).values({
        eventId,
        fromUserId: userId,
        toUserId: targetUserId,
        round: event.currentRound,
      })

      this.logger.log(
        `Speed-dating like: ${userId} → ${targetUserId} (event=${eventId}, round=${event.currentRound})`,
      )

      return { liked: true }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error
      Sentry.captureException(error)
      this.logger.error(`Error submitting like in event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Get mutual matches after event completes.
   */
  async getResults(
    userId: string,
    eventId: string,
  ): Promise<{ matches: { userId: string; round: number }[] }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'completed') {
        throw new BadRequestException('Event has not completed yet')
      }

      // Verify user participated
      const [participant] = await this.db
        .select()
        .from(speedDatingParticipants)
        .where(
          and(
            eq(speedDatingParticipants.eventId, eventId),
            eq(speedDatingParticipants.userId, userId),
          ),
        )
        .limit(1)

      if (!participant) {
        throw new ForbiddenException('You did not participate in this event')
      }

      // Get all likes from this user
      const myLikes = await this.db
        .select()
        .from(speedDatingLikes)
        .where(and(eq(speedDatingLikes.eventId, eventId), eq(speedDatingLikes.fromUserId, userId)))

      // Get all likes TO this user
      const likesToMe = await this.db
        .select()
        .from(speedDatingLikes)
        .where(and(eq(speedDatingLikes.eventId, eventId), eq(speedDatingLikes.toUserId, userId)))

      const likedByMe = new Set(myLikes.map((l) => l.toUserId))
      const mutuals: { userId: string; round: number }[] = []

      for (const like of likesToMe) {
        if (likedByMe.has(like.fromUserId)) {
          mutuals.push({ userId: like.fromUserId, round: like.round })
        }
      }

      return { matches: mutuals }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error
      Sentry.captureException(error)
      this.logger.error(`Error getting results for event ${eventId}`, error)
      throw error
    }
  }

  // --- Admin / Cron methods ---

  /**
   * Start a scheduled event (called by admin or cron).
   */
  async startEvent(eventId: string): Promise<{ started: boolean }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'scheduled') {
        throw new BadRequestException('Event is not in scheduled state')
      }

      if (event.currentParticipants < 2) {
        throw new BadRequestException('Need at least 2 participants to start')
      }

      await this.db
        .update(speedDatingEvents)
        .set({ status: 'active', startedAt: new Date(), currentRound: 1 })
        .where(eq(speedDatingEvents.id, eventId))

      this.logger.log(
        `Speed-dating event started: ${eventId} with ${event.currentParticipants} participants`,
      )

      return { started: true }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error starting speed-dating event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Advance to the next round. If all rounds done, complete the event and create matches.
   */
  async advanceRound(eventId: string): Promise<{ round: number; completed: boolean }> {
    try {
      const event = await this.getEvent(eventId)

      if (event.status !== 'active') {
        throw new BadRequestException('Event is not active')
      }

      const nextRound = event.currentRound + 1

      if (nextRound > event.totalRounds) {
        // All rounds done — complete the event and create matches
        await this.db
          .update(speedDatingEvents)
          .set({ status: 'completed', endedAt: new Date() })
          .where(eq(speedDatingEvents.id, eventId))

        await this.createMatchesFromMutualLikes(eventId)

        this.logger.log(`Speed-dating event completed: ${eventId}`)

        return { round: event.currentRound, completed: true }
      }

      await this.db
        .update(speedDatingEvents)
        .set({ currentRound: nextRound })
        .where(eq(speedDatingEvents.id, eventId))

      this.logger.log(`Speed-dating event ${eventId} advanced to round ${nextRound}`)

      return { round: nextRound, completed: false }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error advancing round for event ${eventId}`, error)
      throw error
    }
  }

  /**
   * Find all mutual likes in a completed event and create real matches.
   */
  private async createMatchesFromMutualLikes(eventId: string): Promise<void> {
    const allLikes = await this.db
      .select()
      .from(speedDatingLikes)
      .where(eq(speedDatingLikes.eventId, eventId))

    // Build adjacency: who liked whom (across all rounds)
    const likeMap = new Map<string, Set<string>>()
    for (const like of allLikes) {
      if (!likeMap.has(like.fromUserId)) likeMap.set(like.fromUserId, new Set())
      likeMap.get(like.fromUserId)!.add(like.toUserId)
    }

    // Find mutuals (deduplicate using sorted pair key)
    const matchedPairs = new Set<string>()
    for (const [from, targets] of likeMap) {
      for (const to of targets) {
        if (likeMap.get(to)?.has(from)) {
          const key = from < to ? `${from}:${to}` : `${to}:${from}`
          if (!matchedPairs.has(key)) {
            matchedPairs.add(key)
            try {
              await this.matchingService.createMatchFromLike(from, to)
              this.logger.log(`Speed-dating match created: ${from} ↔ ${to} (event=${eventId})`)
            } catch (err) {
              this.logger.warn(`Failed to create speed-dating match ${from} ↔ ${to}: ${err}`)
            }
          }
        }
      }
    }

    this.logger.log(`Speed-dating event ${eventId}: ${matchedPairs.size} mutual matches found`)
  }
}
