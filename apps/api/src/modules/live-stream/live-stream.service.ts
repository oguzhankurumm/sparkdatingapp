import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq, and, sql, desc } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { liveStreams, streamViewers, users } from '../../database/schema'
import type {
  StreamListing,
  StreamDetail,
  StartStreamResponse,
  EndStreamResponse,
  JoinStreamResponse,
  StreamCategory,
} from '@spark/types'

@Injectable()
export class LiveStreamService {
  private readonly logger = new Logger(LiveStreamService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // ── Start Stream ──────────────────────────────────────────

  async startStream(
    hostId: string,
    title: string,
    category?: StreamCategory,
  ): Promise<StartStreamResponse> {
    try {
      // Prevent multiple active streams
      const [existing] = await this.db
        .select({ id: liveStreams.id })
        .from(liveStreams)
        .where(and(eq(liveStreams.hostId, hostId), eq(liveStreams.status, 'live')))
        .limit(1)

      if (existing) {
        throw new BadRequestException('You already have an active stream')
      }

      const livekitRoom = `stream_${hostId.slice(0, 8)}_${Date.now()}`

      const [stream] = await this.db
        .insert(liveStreams)
        .values({
          hostId,
          title,
          category: category ?? null,
          livekitRoom,
          status: 'live',
        })
        .returning({ id: liveStreams.id, livekitRoom: liveStreams.livekitRoom })

      this.logger.log(`Stream started: ${stream!.id} by host ${hostId}`)

      return {
        streamId: stream!.id,
        livekitRoom: stream!.livekitRoom!,
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to start stream for host ${hostId}`, error)
      throw error
    }
  }

  // ── End Stream ──────────────────────────────────────────

  async endStream(streamId: string, hostId: string): Promise<EndStreamResponse> {
    try {
      const [stream] = await this.db
        .select()
        .from(liveStreams)
        .where(and(eq(liveStreams.id, streamId), eq(liveStreams.hostId, hostId)))
        .limit(1)

      if (!stream) {
        throw new NotFoundException('Stream not found')
      }
      if (stream.status !== 'live') {
        throw new BadRequestException('Stream is not active')
      }

      const endedAt = new Date()
      const durationSeconds = Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)

      // Mark all viewers as left
      await this.db
        .update(streamViewers)
        .set({ leftAt: endedAt })
        .where(and(eq(streamViewers.streamId, streamId), sql`${streamViewers.leftAt} IS NULL`))

      // End the stream
      const [updated] = await this.db
        .update(liveStreams)
        .set({ status: 'ended', endedAt, viewerCount: 0 })
        .where(eq(liveStreams.id, streamId))
        .returning()

      this.logger.log(
        `Stream ended: ${streamId}, duration=${durationSeconds}s, gifts=${updated!.totalGiftsReceived}, earned=${updated!.totalTokensEarned}`,
      )

      return {
        durationSeconds,
        peakViewerCount: updated!.peakViewerCount,
        totalGiftsReceived: updated!.totalGiftsReceived,
        totalTokensEarned: updated!.totalTokensEarned,
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to end stream ${streamId}`, error)
      throw error
    }
  }

  // ── Join Stream (Viewer) ──────────────────────────────────

  async joinStream(streamId: string, userId: string): Promise<JoinStreamResponse> {
    try {
      const [stream] = await this.db
        .select({
          id: liveStreams.id,
          status: liveStreams.status,
          livekitRoom: liveStreams.livekitRoom,
          hostId: liveStreams.hostId,
        })
        .from(liveStreams)
        .where(eq(liveStreams.id, streamId))
        .limit(1)

      if (!stream) {
        throw new NotFoundException('Stream not found')
      }
      if (stream.status !== 'live') {
        throw new BadRequestException('Stream is not active')
      }
      if (stream.hostId === userId) {
        throw new BadRequestException('Cannot join your own stream as viewer')
      }

      // Insert viewer record (upsert — they might rejoin)
      await this.db.insert(streamViewers).values({ streamId, userId }).onConflictDoNothing()

      // Increment viewer count + update peak
      const [updated] = await this.db
        .update(liveStreams)
        .set({
          viewerCount: sql`${liveStreams.viewerCount} + 1`,
          peakViewerCount: sql`GREATEST(${liveStreams.peakViewerCount}, ${liveStreams.viewerCount} + 1)`,
        })
        .where(eq(liveStreams.id, streamId))
        .returning({ viewerCount: liveStreams.viewerCount })

      this.logger.debug(`Viewer ${userId} joined stream ${streamId}`)

      return {
        livekitRoom: stream.livekitRoom!,
        viewerCount: updated!.viewerCount,
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to join stream ${streamId}`, error)
      throw error
    }
  }

  // ── Leave Stream (Viewer) ──────────────────────────────────

  async leaveStream(streamId: string, userId: string): Promise<void> {
    try {
      // Mark viewer as left
      await this.db
        .update(streamViewers)
        .set({ leftAt: new Date() })
        .where(
          and(
            eq(streamViewers.streamId, streamId),
            eq(streamViewers.userId, userId),
            sql`${streamViewers.leftAt} IS NULL`,
          ),
        )

      // Decrement viewer count (don't go below 0)
      await this.db
        .update(liveStreams)
        .set({
          viewerCount: sql`GREATEST(${liveStreams.viewerCount} - 1, 0)`,
        })
        .where(eq(liveStreams.id, streamId))

      this.logger.debug(`Viewer ${userId} left stream ${streamId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to leave stream ${streamId}`, error)
    }
  }

  // ── Get Active Streams ──────────────────────────────────

  async getActiveStreams(): Promise<StreamListing[]> {
    const rows = await this.db
      .select({
        id: liveStreams.id,
        hostId: liveStreams.hostId,
        hostFirstName: users.firstName,
        hostAvatarUrl: users.avatarUrl,
        hostIsVerified: users.isVerified,
        title: liveStreams.title,
        category: liveStreams.category,
        viewerCount: liveStreams.viewerCount,
        startedAt: liveStreams.startedAt,
      })
      .from(liveStreams)
      .innerJoin(users, eq(liveStreams.hostId, users.id))
      .where(eq(liveStreams.status, 'live'))
      .orderBy(desc(liveStreams.viewerCount))

    return rows.map((r) => ({
      ...r,
      hostFirstName: r.hostFirstName ?? '',
      startedAt: r.startedAt.toISOString(),
      category: r.category as StreamListing['category'],
    }))
  }

  // ── Get Stream Detail ──────────────────────────────────

  async getStreamDetail(streamId: string): Promise<StreamDetail> {
    const [row] = await this.db
      .select({
        id: liveStreams.id,
        hostId: liveStreams.hostId,
        hostFirstName: users.firstName,
        hostAvatarUrl: users.avatarUrl,
        hostIsVerified: users.isVerified,
        title: liveStreams.title,
        category: liveStreams.category,
        viewerCount: liveStreams.viewerCount,
        startedAt: liveStreams.startedAt,
        livekitRoom: liveStreams.livekitRoom,
        peakViewerCount: liveStreams.peakViewerCount,
        totalGiftsReceived: liveStreams.totalGiftsReceived,
        totalTokensEarned: liveStreams.totalTokensEarned,
        status: liveStreams.status,
      })
      .from(liveStreams)
      .innerJoin(users, eq(liveStreams.hostId, users.id))
      .where(eq(liveStreams.id, streamId))
      .limit(1)

    if (!row) {
      throw new NotFoundException('Stream not found')
    }

    return {
      ...row,
      hostFirstName: row.hostFirstName ?? '',
      startedAt: row.startedAt.toISOString(),
      livekitRoom: row.livekitRoom!,
      category: row.category as StreamDetail['category'],
      status: row.status as StreamDetail['status'],
    }
  }

  // ── Record Gift on Stream ──────────────────────────────

  /**
   * Called by gift system when a gift is sent in 'stream' context.
   * Updates the stream's gift counters.
   */
  async recordGift(streamId: string, tokensEarned: number): Promise<void> {
    await this.db
      .update(liveStreams)
      .set({
        totalGiftsReceived: sql`${liveStreams.totalGiftsReceived} + 1`,
        totalTokensEarned: sql`${liveStreams.totalTokensEarned} + ${tokensEarned}`,
      })
      .where(eq(liveStreams.id, streamId))
  }

  // ── Admin: Force End Stream ──────────────────────────────

  async adminForceEnd(streamId: string): Promise<void> {
    const [stream] = await this.db
      .select({ id: liveStreams.id, status: liveStreams.status })
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId))
      .limit(1)

    if (!stream) throw new NotFoundException('Stream not found')
    if (stream.status !== 'live') throw new BadRequestException('Stream is not active')

    await this.db
      .update(streamViewers)
      .set({ leftAt: new Date() })
      .where(and(eq(streamViewers.streamId, streamId), sql`${streamViewers.leftAt} IS NULL`))

    await this.db
      .update(liveStreams)
      .set({ status: 'banned', endedAt: new Date(), viewerCount: 0 })
      .where(eq(liveStreams.id, streamId))

    this.logger.warn(`Stream ${streamId} force-ended by admin`)
  }
}
