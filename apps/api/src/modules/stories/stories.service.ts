import { Inject, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { eq, and, or, sql, desc, lt, inArray } from 'drizzle-orm'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { stories, storyViews, users, matches } from '../../database/schema'
import type {
  StoryItem,
  StoryFeedUser,
  StoryUploadUrlResponse,
  CreateStoryResponse,
  StoryMediaType,
} from '@spark/types'

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name)
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly cdnBaseUrl: string

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
    })
    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET')
    this.cdnBaseUrl = this.configService.getOrThrow<string>('CDN_BASE_URL')
  }

  // ── Generate Presigned Upload URL ──────────────────────────

  async getUploadUrl(userId: string, mediaType: StoryMediaType): Promise<StoryUploadUrlResponse> {
    const ext = mediaType === 'video' ? 'mp4' : 'jpg'
    const key = `stories/${userId}/${Date.now()}.${ext}`

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
    })

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    const mediaUrl = `${this.cdnBaseUrl}/${key}`

    return { uploadUrl, mediaUrl, key }
  }

  // ── Create Story ──────────────────────────────────────────

  async createStory(
    userId: string,
    mediaUrl: string,
    mediaType: StoryMediaType,
    caption?: string,
  ): Promise<CreateStoryResponse> {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      const [story] = await this.db
        .insert(stories)
        .values({
          userId,
          mediaUrl,
          mediaType,
          caption: caption ?? null,
          expiresAt,
        })
        .returning({ id: stories.id, expiresAt: stories.expiresAt })

      this.logger.log(`Story created: ${story!.id} by user ${userId}`)

      return {
        id: story!.id,
        expiresAt: story!.expiresAt.toISOString(),
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to create story for user ${userId}`, error)
      throw error
    }
  }

  // ── Get Story Feed (Matched Users' Stories) ────────────────

  async getStoryFeed(userId: string): Promise<StoryFeedUser[]> {
    try {
      const now = new Date()

      // Find all active match partner IDs
      const matchRows = await this.db
        .select({
          user1Id: matches.user1Id,
          user2Id: matches.user2Id,
        })
        .from(matches)
        .where(
          and(
            eq(matches.status, 'active'),
            or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          ),
        )

      const matchedUserIds = matchRows.map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id))

      // Include the user's own stories in the feed
      matchedUserIds.push(userId)

      if (matchedUserIds.length === 0) return []

      // Fetch all active stories from matched users + self
      const storyRows = await this.db
        .select({
          id: stories.id,
          userId: stories.userId,
          mediaUrl: stories.mediaUrl,
          mediaType: stories.mediaType,
          caption: stories.caption,
          expiresAt: stories.expiresAt,
          createdAt: stories.createdAt,
          // User info
          firstName: users.firstName,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified,
        })
        .from(stories)
        .innerJoin(users, eq(stories.userId, users.id))
        .where(and(inArray(stories.userId, matchedUserIds), sql`${stories.expiresAt} > ${now}`))
        .orderBy(desc(stories.createdAt))

      if (storyRows.length === 0) return []

      // Fetch view statuses for this user
      const storyIds = storyRows.map((s) => s.id)
      const viewRows = await this.db
        .select({ storyId: storyViews.storyId })
        .from(storyViews)
        .where(and(inArray(storyViews.storyId, storyIds), eq(storyViews.viewerId, userId)))

      const viewedStoryIds = new Set(viewRows.map((v) => v.storyId))

      // Fetch view counts
      const viewCounts = await this.db
        .select({
          storyId: storyViews.storyId,
          count: sql<number>`count(*)::int`,
        })
        .from(storyViews)
        .where(inArray(storyViews.storyId, storyIds))
        .groupBy(storyViews.storyId)

      const viewCountMap = new Map(viewCounts.map((v) => [v.storyId, v.count]))

      // Group by user
      const userMap = new Map<string, StoryFeedUser>()

      for (const row of storyRows) {
        if (!userMap.has(row.userId)) {
          userMap.set(row.userId, {
            userId: row.userId,
            firstName: row.firstName ?? '',
            avatarUrl: row.avatarUrl,
            isVerified: row.isVerified,
            hasUnviewed: false,
            stories: [],
          })
        }

        const hasViewed = viewedStoryIds.has(row.id)
        const feedUser = userMap.get(row.userId)!

        feedUser.stories.push({
          id: row.id,
          userId: row.userId,
          mediaUrl: row.mediaUrl,
          mediaType: row.mediaType as StoryMediaType,
          caption: row.caption,
          expiresAt: row.expiresAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
          viewCount: viewCountMap.get(row.id) ?? 0,
          hasViewed,
        })

        if (!hasViewed) {
          feedUser.hasUnviewed = true
        }
      }

      // Sort: unviewed first, then by most recent story
      const result = Array.from(userMap.values())
      result.sort((a, b) => {
        if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1
        // Own stories always first
        if (a.userId === userId) return -1
        if (b.userId === userId) return 1
        return 0
      })

      return result
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to get story feed for user ${userId}`, error)
      throw error
    }
  }

  // ── Get User Stories ──────────────────────────────────────

  async getUserStories(targetUserId: string, viewerId: string): Promise<StoryItem[]> {
    try {
      const now = new Date()

      const storyRows = await this.db
        .select({
          id: stories.id,
          userId: stories.userId,
          mediaUrl: stories.mediaUrl,
          mediaType: stories.mediaType,
          caption: stories.caption,
          expiresAt: stories.expiresAt,
          createdAt: stories.createdAt,
        })
        .from(stories)
        .where(and(eq(stories.userId, targetUserId), sql`${stories.expiresAt} > ${now}`))
        .orderBy(desc(stories.createdAt))

      if (storyRows.length === 0) return []

      const storyIds = storyRows.map((s) => s.id)

      // Viewer's view status
      const viewRows = await this.db
        .select({ storyId: storyViews.storyId })
        .from(storyViews)
        .where(and(inArray(storyViews.storyId, storyIds), eq(storyViews.viewerId, viewerId)))

      const viewedIds = new Set(viewRows.map((v) => v.storyId))

      // View counts (only visible to story owner)
      let viewCountMap = new Map<string, number>()
      if (targetUserId === viewerId) {
        const viewCounts = await this.db
          .select({
            storyId: storyViews.storyId,
            count: sql<number>`count(*)::int`,
          })
          .from(storyViews)
          .where(inArray(storyViews.storyId, storyIds))
          .groupBy(storyViews.storyId)

        viewCountMap = new Map(viewCounts.map((v) => [v.storyId, v.count]))
      }

      return storyRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        mediaUrl: row.mediaUrl,
        mediaType: row.mediaType as StoryMediaType,
        caption: row.caption,
        expiresAt: row.expiresAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
        viewCount: viewCountMap.get(row.id) ?? 0,
        hasViewed: viewedIds.has(row.id),
      }))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to get stories for user ${targetUserId}`, error)
      throw error
    }
  }

  // ── Mark Story Viewed ──────────────────────────────────────

  async markViewed(storyId: string, viewerId: string): Promise<void> {
    try {
      const [story] = await this.db
        .select({ id: stories.id, userId: stories.userId })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1)

      if (!story) {
        throw new NotFoundException('Story not found')
      }

      // Don't record self-views
      if (story.userId === viewerId) return

      await this.db.insert(storyViews).values({ storyId, viewerId }).onConflictDoNothing()

      this.logger.debug(`User ${viewerId} viewed story ${storyId}`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to mark story ${storyId} as viewed`, error)
      throw error
    }
  }

  // ── Delete Story ──────────────────────────────────────────

  async deleteStory(storyId: string, userId: string): Promise<void> {
    try {
      const [story] = await this.db
        .select({ id: stories.id, userId: stories.userId, mediaUrl: stories.mediaUrl })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1)

      if (!story) {
        throw new NotFoundException('Story not found')
      }
      if (story.userId !== userId) {
        throw new ForbiddenException('Not authorized to delete this story')
      }

      // Delete from DB (cascade deletes views)
      await this.db.delete(stories).where(eq(stories.id, storyId))

      // Delete from S3 (best effort)
      try {
        const key = this.extractS3Key(story.mediaUrl)
        if (key) {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        }
      } catch (s3Error) {
        this.logger.warn(`Failed to delete S3 object for story ${storyId}`, s3Error)
      }

      this.logger.log(`Story deleted: ${storyId} by user ${userId}`)
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error
      Sentry.captureException(error)
      this.logger.error(`Failed to delete story ${storyId}`, error)
      throw error
    }
  }

  // ── Cleanup Expired Stories (Cron Job) ──────────────────────

  async cleanupExpired(): Promise<number> {
    try {
      const now = new Date()

      // Get expired stories for S3 cleanup
      const expired = await this.db
        .select({ id: stories.id, mediaUrl: stories.mediaUrl })
        .from(stories)
        .where(lt(stories.expiresAt, now))

      if (expired.length === 0) return 0

      // Delete from DB
      const expiredIds = expired.map((s) => s.id)
      await this.db.delete(stories).where(inArray(stories.id, expiredIds))

      // Best-effort S3 cleanup
      for (const story of expired) {
        try {
          const key = this.extractS3Key(story.mediaUrl)
          if (key) {
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
          }
        } catch {
          // Non-critical — S3 lifecycle rules will catch orphans
        }
      }

      this.logger.log(`Cleaned up ${expired.length} expired stories`)
      return expired.length
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to cleanup expired stories', error)
      throw error
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  private extractS3Key(mediaUrl: string): string | null {
    try {
      const url = new URL(mediaUrl)
      // CDN URL: https://cdn.example.com/stories/userId/timestamp.jpg
      return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
    } catch {
      return null
    }
  }
}
