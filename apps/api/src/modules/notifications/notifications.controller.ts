import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common'
import type { NotificationsService } from './notifications.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/notifications — paginated list of notifications for the current user */
  @Get()
  async getNotifications(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getForUser(user.id, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }

  /** GET /api/notifications/unread-count — number of unread notifications */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id)
    return { unreadCount: count }
  }

  /** POST /api/notifications/:id/read — mark a single notification as read */
  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationsService.markAsRead(id, user.id)
    return { success: true }
  }

  /** POST /api/notifications/read-all — mark all notifications as read */
  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id)
  }

  /** DELETE /api/notifications/:id — delete a single notification */
  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: User) {
    await this.notificationsService.delete(id, user.id)
    return { success: true }
  }

  /** DELETE /api/notifications — delete all notifications */
  @Delete()
  async deleteAllNotifications(@CurrentUser() user: User) {
    return this.notificationsService.deleteAll(user.id)
  }
}
