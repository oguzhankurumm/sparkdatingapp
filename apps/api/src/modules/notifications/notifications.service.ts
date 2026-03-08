import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { notifications, users } from '../../database/schema'
import type { CreateNotificationInput } from './dto'
import type { NotificationsGateway } from './notifications.gateway'

export interface NotificationWithActor {
  id: string
  type: string
  title: string
  body: string | null
  data: unknown
  read: boolean
  createdAt: Date
  actor: {
    id: string
    firstName: string
    avatarUrl: string | null
  } | null
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(forwardRef(() => 'NotificationsGateway'))
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Create a new notification and return it.
   * The gateway layer handles real-time delivery after calling this.
   */
  async create(input: CreateNotificationInput): Promise<NotificationWithActor> {
    try {
      const [notification] = await this.db
        .insert(notifications)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data,
          actorId: input.actorId,
        })
        .returning()

      if (!notification) {
        throw new Error('Failed to create notification')
      }

      // Resolve actor info if present
      let actor: NotificationWithActor['actor'] = null
      if (notification.actorId) {
        const [actorRow] = await this.db
          .select({
            id: users.id,
            firstName: users.firstName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, notification.actorId))
          .limit(1)

        actor = actorRow ?? null
      }

      this.logger.log(
        `Notification created: ${notification.id} (${notification.type}) for user ${notification.userId}`,
      )

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        read: notification.read,
        createdAt: notification.createdAt,
        actor,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to create notification', error)
      throw error
    }
  }

  /**
   * Convenience method: create a notification AND push it in real-time.
   * This is the primary method other modules should call.
   */
  async notify(input: CreateNotificationInput): Promise<NotificationWithActor> {
    const notification = await this.create(input)

    // Push real-time via WebSocket
    this.gateway.emitToUser(input.userId, 'notification:new', notification)

    return notification
  }

  /**
   * Get paginated notifications for a user.
   * Includes actor info (who triggered the notification).
   * Ordered by createdAt DESC (newest first).
   */
  async getForUser(
    userId: string,
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ notifications: NotificationWithActor[]; total: number }> {
    try {
      const limit = options.limit ?? 20
      const offset = options.offset ?? 0

      // Get total count
      const [countResult] = await this.db
        .select({ total: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId))

      const total = countResult?.total ?? 0

      // Get notifications
      const rows = await this.db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset)

      // Resolve actors in bulk
      const actorIds = [...new Set(rows.filter((r) => r.actorId).map((r) => r.actorId as string))]

      const actorMap = new Map<
        string,
        { id: string; firstName: string; avatarUrl: string | null }
      >()

      if (actorIds.length > 0) {
        const actorRows = await this.db
          .select({
            id: users.id,
            firstName: users.firstName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(sql`${users.id} IN ${actorIds}`)

        for (const actor of actorRows) {
          actorMap.set(actor.id, actor)
        }
      }

      const result: NotificationWithActor[] = rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data,
        read: row.read,
        createdAt: row.createdAt,
        actor: row.actorId ? (actorMap.get(row.actorId) ?? null) : null,
      }))

      return { notifications: result, total }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get notifications for user', error)
      throw error
    }
  }

  /**
   * Get the count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const [result] = await this.db
        .select({ total: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))

      return result?.total ?? 0
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to get unread count', error)
      throw error
    }
  }

  /**
   * Mark a single notification as read. Verifies ownership.
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const [updated] = await this.db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning({ id: notifications.id })

      if (!updated) {
        throw new NotFoundException('Notification not found')
      }

      this.logger.log(`Notification ${notificationId} marked as read`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to mark notification as read', error)
      throw error
    }
  }

  /**
   * Mark all unread notifications as read for a user.
   * Returns the number of notifications marked.
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    try {
      const result = await this.db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        .returning({ id: notifications.id })

      this.logger.log(`Marked ${result.length} notifications as read for user ${userId}`)

      return { markedCount: result.length }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to mark all as read', error)
      throw error
    }
  }

  /**
   * Delete a single notification. Verifies ownership.
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    try {
      const [deleted] = await this.db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning({ id: notifications.id })

      if (!deleted) {
        throw new NotFoundException('Notification not found')
      }

      this.logger.log(`Notification ${notificationId} deleted`)
    } catch (error) {
      if (error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error('Failed to delete notification', error)
      throw error
    }
  }

  /**
   * Delete all notifications for a user (clear history).
   */
  async deleteAll(userId: string): Promise<{ deletedCount: number }> {
    try {
      const result = await this.db
        .delete(notifications)
        .where(eq(notifications.userId, userId))
        .returning({ id: notifications.id })

      this.logger.log(`Deleted ${result.length} notifications for user ${userId}`)

      return { deletedCount: result.length }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to delete all notifications', error)
      throw error
    }
  }
}
