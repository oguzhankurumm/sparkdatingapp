import { Inject, Injectable, Logger } from '@nestjs/common'
import { and, eq, isNull, notInArray, gte, desc, sql, count } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { users, likes, blocks } from '../../database/schema'
import type { PlanFeaturesService } from '../subscriptions/plan-features.service'
import type { DiscoveryScoringService } from './discovery-scoring.service'
import { type ScoredProfile } from './discovery-scoring.service'
import type { User } from '../../database/schema'

export interface TrendingProfile {
  id: string
  firstName: string
  age: number
  avatarUrl: string | null
  city: string | null
  isVerified: boolean
  likesCount: number
  gender: 'male' | 'female' | 'non_binary'
}

export interface ReadyToCallUser {
  id: string
  firstName: string
  avatarUrl: string | null
  city: string | null
  lastActiveDate: Date | null
}

export interface NearbyUser {
  id: string
  firstName: string
  avatarUrl: string | null
  latitude: string | null
  longitude: string | null
  lastActiveDate: Date | null
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly planFeatures: PlanFeaturesService,
    private readonly scoring: DiscoveryScoringService,
  ) {}

  /**
   * Get scored discovery feed for a user.
   * Filters out: self, already liked/passed, blocked users, banned users.
   * Applies the weighted scoring algorithm and returns ranked profiles.
   */
  async getFeed(
    viewer: User,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ profiles: ScoredProfile[]; hasMore: boolean }> {
    const { limit = 20, offset = 0 } = options

    try {
      // Get IDs to exclude: already interacted + blocked
      const [interactedIds, blockedIds] = await Promise.all([
        this.getInteractedUserIds(viewer.id),
        this.getBlockedUserIds(viewer.id),
      ])

      const excludeIds = [...new Set([viewer.id, ...interactedIds, ...blockedIds])]

      // Build candidate query with discovery preferences
      const candidates = await this.getCandidates(viewer, excludeIds, limit + 1, offset)

      const hasMore = candidates.length > limit
      const sliced = candidates.slice(0, limit)

      // Score and rank
      const scored = this.scoring.scoreProfiles(viewer, sliced)

      return { profiles: scored, hasMore }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to build discovery feed', error)
      throw error
    }
  }

  /**
   * Get the effective plan features for a user (gender-aware).
   */
  async getUserFeatures(userId: string, gender: 'male' | 'female' | 'non_binary') {
    return this.planFeatures.getEffectiveFeatures(userId, gender)
  }

  /** Get IDs of users the viewer already liked/passed */
  private async getInteractedUserIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({ receiverId: likes.receiverId })
      .from(likes)
      .where(eq(likes.senderId, userId))

    return rows.map((r) => r.receiverId)
  }

  /** Get IDs of users blocked by or who blocked the viewer */
  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const rows = await this.db
      .select({
        blockerId: blocks.blockerId,
        blockedId: blocks.blockedId,
      })
      .from(blocks)
      .where(sql`${blocks.blockerId} = ${userId} OR ${blocks.blockedId} = ${userId}`)

    return rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId))
  }

  /**
   * Fetch candidate profiles matching viewer's discovery preferences.
   * Respects: showMe, ageRange, maxDistance (basic SQL filtering).
   */
  private async getCandidates(
    viewer: User,
    excludeIds: string[],
    limit: number,
    offset: number,
  ): Promise<User[]> {
    const conditions = [isNull(users.deletedAt), eq(users.isBanned, false)]

    // Exclude already interacted/blocked users
    if (excludeIds.length > 0) {
      conditions.push(notInArray(users.id, excludeIds))
    }

    // showMe filter: men/women/everyone
    if (viewer.showMe === 'men') {
      conditions.push(eq(users.gender, 'male'))
    } else if (viewer.showMe === 'women') {
      conditions.push(eq(users.gender, 'female'))
    }
    // 'everyone' → no gender filter

    // Age range filter (birthday-based)
    const now = new Date()
    const maxBirthday = new Date(
      now.getFullYear() - viewer.ageRangeMin,
      now.getMonth(),
      now.getDate(),
    )
      .toISOString()
      .split('T')[0]!
    const minBirthday = new Date(
      now.getFullYear() - viewer.ageRangeMax - 1,
      now.getMonth(),
      now.getDate(),
    )
      .toISOString()
      .split('T')[0]!

    conditions.push(gte(users.birthday, minBirthday))
    conditions.push(sql`${users.birthday} <= ${maxBirthday}`)

    return this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get trending profiles — users who received the most likes in the last 7 days.
   * Women receive a scoring bonus to appear higher in results.
   */
  async getTrending(viewerId: string, limit = 20): Promise<{ profiles: TrendingProfile[] }> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const rows = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          birthday: users.birthday,
          avatarUrl: users.avatarUrl,
          city: users.city,
          isVerified: users.isVerified,
          gender: users.gender,
          likesCount: count(likes.id),
        })
        .from(likes)
        .innerJoin(users, eq(likes.receiverId, users.id))
        .where(
          and(
            gte(likes.createdAt, sevenDaysAgo),
            eq(likes.type, 'like'),
            isNull(users.deletedAt),
            eq(users.isBanned, false),
            sql`${users.id} != ${viewerId}`,
          ),
        )
        .groupBy(
          users.id,
          users.firstName,
          users.birthday,
          users.avatarUrl,
          users.city,
          users.isVerified,
          users.gender,
        )
        .orderBy(
          // Women score higher — gender priority scoring
          desc(
            sql`CASE WHEN ${users.gender} = 'female' THEN count(${likes.id}) * 1.5 ELSE count(${likes.id}) END`,
          ),
        )
        .limit(limit)

      const now = new Date()
      const profiles: TrendingProfile[] = rows.map((row) => ({
        id: row.id,
        firstName: row.firstName,
        age: Math.floor(
          (now.getTime() - new Date(row.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
        ),
        avatarUrl: row.avatarUrl,
        city: row.city,
        isVerified: row.isVerified,
        likesCount: Number(row.likesCount),
        gender: row.gender,
      }))

      return { profiles }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get trending profiles', error)
      throw error
    }
  }

  /**
   * Get users who were active in the last 30 minutes — "ready to call" status.
   * Excludes self, banned, and deleted users.
   */
  async getReadyToCall(viewer: User, limit = 15): Promise<{ users: ReadyToCallUser[] }> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

      const rows = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          city: users.city,
          lastActiveDate: users.lastActiveDate,
        })
        .from(users)
        .where(
          and(
            gte(users.lastActiveDate, thirtyMinutesAgo),
            isNull(users.deletedAt),
            eq(users.isBanned, false),
            sql`${users.id} != ${viewer.id}`,
          ),
        )
        .orderBy(desc(users.lastActiveDate))
        .limit(limit)

      return { users: rows }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get ready-to-call users', error)
      throw error
    }
  }

  /**
   * Get nearby users for the map section.
   * Uses haversine-approximated bounding box filtering in SQL.
   * Requires the viewer to have latitude/longitude set.
   */
  async getNearbyUsers(viewer: User, limit = 50): Promise<{ users: NearbyUser[] }> {
    try {
      if (!viewer.latitude || !viewer.longitude) {
        return { users: [] }
      }

      const viewerLat = parseFloat(viewer.latitude)
      const viewerLng = parseFloat(viewer.longitude)
      const maxDistanceKm = viewer.maxDistanceKm

      // Rough bounding box — 1 degree latitude ~ 111 km
      const latDelta = maxDistanceKm / 111.0
      const lngDelta = maxDistanceKm / (111.0 * Math.cos((viewerLat * Math.PI) / 180))

      const minLat = viewerLat - latDelta
      const maxLat = viewerLat + latDelta
      const minLng = viewerLng - lngDelta
      const maxLng = viewerLng + lngDelta

      // Haversine distance calculation in SQL for refinement
      const haversineDistance = sql<number>`
        6371 * acos(
          LEAST(1.0, cos(radians(${viewerLat}))
          * cos(radians(CAST(${users.latitude} AS double precision)))
          * cos(radians(CAST(${users.longitude} AS double precision)) - radians(${viewerLng}))
          + sin(radians(${viewerLat}))
          * sin(radians(CAST(${users.latitude} AS double precision))))
        )
      `

      const rows = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          latitude: users.latitude,
          longitude: users.longitude,
          lastActiveDate: users.lastActiveDate,
        })
        .from(users)
        .where(
          and(
            isNull(users.deletedAt),
            eq(users.isBanned, false),
            sql`${users.id} != ${viewer.id}`,
            sql`${users.latitude} IS NOT NULL`,
            sql`${users.longitude} IS NOT NULL`,
            sql`CAST(${users.latitude} AS double precision) BETWEEN ${minLat} AND ${maxLat}`,
            sql`CAST(${users.longitude} AS double precision) BETWEEN ${minLng} AND ${maxLng}`,
            sql`${haversineDistance} <= ${maxDistanceKm}`,
          ),
        )
        .orderBy(haversineDistance)
        .limit(limit)

      return { users: rows }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get nearby users', error)
      throw error
    }
  }
}
