import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { eq, and, or, desc, sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { videoCalls, videoCallTicks, users } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'
import type { MatchingService } from '../matching/matching.service'
import { TOKEN_ECONOMY } from '@spark/types'

const MIN_CALL_RATE = 10
const MAX_CALL_RATE = 100

@Injectable()
export class VideoCallsService {
  private readonly logger = new Logger(VideoCallsService.name)

  /** Track active billing intervals — callId → timer */
  private readonly billingIntervals = new Map<string, ReturnType<typeof setInterval>>()

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Initiate a video call.
   * - Matched users → call starts ringing immediately
   * - Non-matched "ready for call" users → call starts ringing (receiver must accept)
   * Creates a LiveKit room name and stores the call record.
   */
  async initiateCall(
    callerId: string,
    receiverId: string,
    callType: 'video' | 'audio' = 'video',
  ): Promise<{
    callId: string
    livekitRoom: string
    tokenRatePerMinute: number
    isDirectCall: boolean
    callType: 'video' | 'audio'
  }> {
    try {
      if (callerId === receiverId) {
        throw new BadRequestException('Cannot call yourself')
      }

      // Get receiver info (rate + readyForCall)
      const [receiver] = await this.db
        .select({
          id: users.id,
          isReadyForCall: users.isReadyForCall,
          callRate: users.callRate,
          isBanned: users.isBanned,
        })
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1)

      if (!receiver) {
        throw new NotFoundException('User not found')
      }

      if (receiver.isBanned) {
        throw new BadRequestException('Cannot call this user')
      }

      // Check if users are matched
      const isMatched = await this.matchingService.isMatched(callerId, receiverId)

      if (!isMatched && !receiver.isReadyForCall) {
        throw new BadRequestException(
          'This user is not available for calls. You can only call matched users or users who are "Ready for Call".',
        )
      }

      // Check caller has enough tokens for at least 1 minute
      const callerBalance = await this.walletService.getBalance(callerId)
      if (callerBalance < receiver.callRate) {
        throw new BadRequestException(
          `Insufficient tokens. You need at least ${receiver.callRate} tokens for 1 minute. Current balance: ${callerBalance}.`,
        )
      }

      // Check no active call for either user
      await this.ensureNoActiveCall(callerId)
      await this.ensureNoActiveCall(receiverId)

      // Create room name — prefix with call type for LiveKit track config
      const livekitRoom = `${callType}_${callerId.slice(0, 8)}_${receiverId.slice(0, 8)}_${Date.now()}`

      // Create call record
      const [call] = await this.db
        .insert(videoCalls)
        .values({
          callerId,
          receiverId,
          status: 'ringing',
          callType,
          livekitRoom,
          tokenRatePerMinute: receiver.callRate,
        })
        .returning()

      if (!call) {
        throw new Error('Failed to create call record')
      }

      this.logger.log(
        `Call initiated: ${call.id} (${callType}) from ${callerId} to ${receiverId} (rate: ${receiver.callRate}t/min, matched: ${isMatched})`,
      )

      return {
        callId: call.id,
        livekitRoom: call.livekitRoom!,
        tokenRatePerMinute: call.tokenRatePerMinute,
        isDirectCall: isMatched,
        callType,
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to initiate call', error)
      throw error
    }
  }

  /**
   * Accept an incoming call — moves status to 'active' and starts billing.
   */
  async acceptCall(
    callId: string,
    userId: string,
  ): Promise<{
    livekitRoom: string
    tokenRatePerMinute: number
    callType: 'video' | 'audio'
  }> {
    try {
      const call = await this.getCallOrThrow(callId)

      if (call.receiverId !== userId) {
        throw new ForbiddenException('Only the receiver can accept a call')
      }

      if (call.status !== 'ringing') {
        throw new BadRequestException(`Call is not ringing (current status: ${call.status})`)
      }

      const now = new Date()

      const [updated] = await this.db
        .update(videoCalls)
        .set({ status: 'active', startedAt: now })
        .where(eq(videoCalls.id, callId))
        .returning()

      if (!updated) {
        throw new Error('Failed to accept call')
      }

      // Start per-minute billing
      this.startBilling(callId, updated.callerId, updated.receiverId, updated.tokenRatePerMinute)

      this.logger.log(
        `Call ${callId} accepted, billing started at ${updated.tokenRatePerMinute}t/min`,
      )

      return {
        livekitRoom: updated.livekitRoom!,
        tokenRatePerMinute: updated.tokenRatePerMinute,
        callType: updated.callType as 'video' | 'audio',
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to accept call', error)
      throw error
    }
  }

  /**
   * Decline an incoming call.
   */
  async declineCall(callId: string, userId: string): Promise<void> {
    try {
      const call = await this.getCallOrThrow(callId)

      if (call.receiverId !== userId) {
        throw new ForbiddenException('Only the receiver can decline a call')
      }

      if (call.status !== 'ringing') {
        throw new BadRequestException(`Call is not ringing (current status: ${call.status})`)
      }

      await this.db
        .update(videoCalls)
        .set({ status: 'declined', endedAt: new Date() })
        .where(eq(videoCalls.id, callId))

      this.logger.log(`Call ${callId} declined by ${userId}`)
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to decline call', error)
      throw error
    }
  }

  /**
   * End an active call. Either participant can end it.
   * Stops billing and records final duration.
   */
  async endCall(
    callId: string,
    userId: string,
  ): Promise<{
    durationSeconds: number
    totalTokensCharged: number
  }> {
    try {
      const call = await this.getCallOrThrow(callId)

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new ForbiddenException('You are not part of this call')
      }

      if (call.status !== 'active' && call.status !== 'ringing') {
        throw new BadRequestException(`Call is not active (current status: ${call.status})`)
      }

      // Stop billing interval
      this.stopBilling(callId)

      const now = new Date()
      const startedAt = call.startedAt ?? call.createdAt
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

      const [updated] = await this.db
        .update(videoCalls)
        .set({
          status: 'completed',
          endedAt: now,
          durationSeconds: Math.max(0, durationSeconds),
        })
        .where(eq(videoCalls.id, callId))
        .returning()

      this.logger.log(
        `Call ${callId} ended: ${updated?.durationSeconds ?? 0}s, ${updated?.totalTokensCharged ?? 0} tokens charged`,
      )

      return {
        durationSeconds: updated?.durationSeconds ?? 0,
        totalTokensCharged: updated?.totalTokensCharged ?? 0,
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Failed to end call', error)
      throw error
    }
  }

  /**
   * Toggle the user's "ready for call" status.
   */
  async setReadyForCall(userId: string, isReady: boolean): Promise<void> {
    await this.db
      .update(users)
      .set({ isReadyForCall: isReady, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  /**
   * Update the user's call rate (tokens per minute).
   */
  async setCallRate(userId: string, rate: number): Promise<void> {
    if (rate < MIN_CALL_RATE || rate > MAX_CALL_RATE) {
      throw new BadRequestException(
        `Call rate must be between ${MIN_CALL_RATE} and ${MAX_CALL_RATE} tokens/minute`,
      )
    }

    await this.db
      .update(users)
      .set({ callRate: rate, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  /**
   * Get call history for a user (most recent first).
   */
  async getCallHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    calls: Array<{
      id: string
      partnerId: string
      partnerFirstName: string
      partnerAvatarUrl: string | null
      direction: 'outgoing' | 'incoming'
      callType: string
      status: string
      durationSeconds: number
      totalTokensCharged: number
      tokenRatePerMinute: number
      createdAt: Date
    }>
    total: number
  }> {
    try {
      // Get total count
      const [countResult] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(videoCalls)
        .where(or(eq(videoCalls.callerId, userId), eq(videoCalls.receiverId, userId)))

      const total = countResult?.count ?? 0

      // Get paginated calls
      const callRows = await this.db
        .select()
        .from(videoCalls)
        .where(or(eq(videoCalls.callerId, userId), eq(videoCalls.receiverId, userId)))
        .orderBy(desc(videoCalls.createdAt))
        .limit(limit)
        .offset(offset)

      // Enrich with partner info
      const calls = await Promise.all(
        callRows.map(async (call) => {
          const partnerId = call.callerId === userId ? call.receiverId : call.callerId
          const [partner] = await this.db
            .select({
              firstName: users.firstName,
              avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(eq(users.id, partnerId))
            .limit(1)

          return {
            id: call.id,
            partnerId,
            partnerFirstName: partner?.firstName ?? 'Unknown',
            partnerAvatarUrl: partner?.avatarUrl ?? null,
            direction: (call.callerId === userId ? 'outgoing' : 'incoming') as
              | 'outgoing'
              | 'incoming',
            callType: call.callType,
            status: call.status,
            durationSeconds: call.durationSeconds,
            totalTokensCharged: call.totalTokensCharged,
            tokenRatePerMinute: call.tokenRatePerMinute,
            createdAt: call.createdAt,
          }
        }),
      )

      return { calls, total }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get call history', error)
      throw error
    }
  }

  /**
   * Get users who are "Ready for Call" — for the Calls tab browse section.
   */
  async getReadyForCallUsers(
    currentUserId: string,
    limit = 20,
    offset = 0,
  ): Promise<
    Array<{
      id: string
      firstName: string
      avatarUrl: string | null
      isVerified: boolean
      callRate: number
    }>
  > {
    try {
      return this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
          callRate: users.callRate,
        })
        .from(users)
        .where(
          and(
            eq(users.isReadyForCall, true),
            eq(users.isBanned, false),
            sql`${users.id} != ${currentUserId}`,
            sql`${users.deletedAt} IS NULL`,
          ),
        )
        .orderBy(desc(users.lastActiveDate))
        .limit(limit)
        .offset(offset)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get ready for call users', error)
      throw error
    }
  }

  // ── Private helpers ─────────────────────────────────────

  /**
   * Start per-minute billing for an active call.
   * Every 60 seconds: charge caller, credit callee (80%), record tick.
   */
  private startBilling(
    callId: string,
    callerId: string,
    receiverId: string,
    ratePerMinute: number,
  ): void {
    let minute = 0

    const interval = setInterval(async () => {
      minute++
      try {
        const calleeEarning = Math.floor((ratePerMinute * TOKEN_ECONOMY.CREATOR_CUT_PERCENT) / 100)

        // Check caller can afford this minute
        const callerBalance = await this.walletService.getBalance(callerId)
        if (callerBalance < ratePerMinute) {
          this.logger.warn(
            `Call ${callId} auto-ending: caller insufficient balance (${callerBalance} < ${ratePerMinute})`,
          )
          // End call gracefully — caller ran out of tokens
          this.stopBilling(callId)
          await this.forceEndCall(callId)
          return
        }

        // Charge caller
        await this.walletService.deductTokens(
          callerId,
          ratePerMinute,
          'call_charge',
          `Video call minute ${minute}`,
          callId,
          'video_call',
        )

        // Credit callee (80%)
        await this.walletService.creditTokens(
          receiverId,
          calleeEarning,
          'call_earning',
          `Video call earning minute ${minute}`,
          callId,
          'video_call',
        )

        // Record tick
        await this.db.insert(videoCallTicks).values({
          callId,
          minute,
          tokensCharged: ratePerMinute,
        })

        // Update call totals
        await this.db
          .update(videoCalls)
          .set({
            totalTokensCharged: sql`total_tokens_charged + ${ratePerMinute}`,
            durationSeconds: minute * 60,
          })
          .where(eq(videoCalls.id, callId))
      } catch (error) {
        Sentry.captureException(error)
        this.logger.error(`Billing tick failed for call ${callId}, minute ${minute}`, error)
        // If billing fails, end the call
        this.stopBilling(callId)
        await this.forceEndCall(callId)
      }
    }, 60_000) // Every 60 seconds

    this.billingIntervals.set(callId, interval)
  }

  private stopBilling(callId: string): void {
    const interval = this.billingIntervals.get(callId)
    if (interval) {
      clearInterval(interval)
      this.billingIntervals.delete(callId)
    }
  }

  private async forceEndCall(callId: string): Promise<void> {
    try {
      const [call] = await this.db
        .select()
        .from(videoCalls)
        .where(eq(videoCalls.id, callId))
        .limit(1)

      if (!call || (call.status !== 'active' && call.status !== 'ringing')) return

      const now = new Date()
      const startedAt = call.startedAt ?? call.createdAt
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000)

      await this.db
        .update(videoCalls)
        .set({
          status: 'completed',
          endedAt: now,
          durationSeconds: Math.max(0, durationSeconds),
        })
        .where(eq(videoCalls.id, callId))

      this.logger.log(`Call ${callId} force-ended (duration: ${durationSeconds}s)`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to force-end call ${callId}`, error)
    }
  }

  private async getCallOrThrow(callId: string) {
    const [call] = await this.db.select().from(videoCalls).where(eq(videoCalls.id, callId)).limit(1)

    if (!call) {
      throw new NotFoundException('Call not found')
    }

    return call
  }

  private async ensureNoActiveCall(userId: string): Promise<void> {
    const [existing] = await this.db
      .select({ id: videoCalls.id })
      .from(videoCalls)
      .where(
        and(
          or(eq(videoCalls.callerId, userId), eq(videoCalls.receiverId, userId)),
          or(eq(videoCalls.status, 'active'), eq(videoCalls.status, 'ringing')),
        ),
      )
      .limit(1)

    if (existing) {
      throw new BadRequestException('User is already in an active call')
    }
  }
}
