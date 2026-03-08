import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common'
import type { MessagingService } from './messaging.service'
import { CurrentUser } from '../../common/decorators'
import { sendMessageSchema } from './dto'
import type { User } from '../../database/schema'

@Controller('matches/:matchId/messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * GET /api/matches/:matchId/messages?cursor=&limit=
   * Get paginated messages for a match.
   */
  @Get()
  async getMessages(
    @Param('matchId') matchId: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getMessages(
      matchId,
      user.id,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    )
  }

  /**
   * POST /api/matches/:matchId/messages
   * Send a message in a match.
   */
  @Post()
  async sendMessage(
    @Param('matchId') matchId: string,
    @CurrentUser() user: User,
    @Body() body: unknown,
  ) {
    const parsed = sendMessageSchema.safeParse(body)

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }

    return this.messagingService.sendMessage(matchId, user.id, parsed.data)
  }

  /**
   * POST /api/matches/:matchId/messages/read
   * Mark all unread messages from the partner as read.
   */
  @Post('read')
  async markAsRead(@Param('matchId') matchId: string, @CurrentUser() user: User) {
    return this.messagingService.markAsRead(matchId, user.id)
  }

  /**
   * GET /api/matches/:matchId/messages/unread-count
   * Get total unread message count for the authenticated user across all matches.
   * Note: This is scoped globally, matchId in the path is ignored for this endpoint.
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    return this.messagingService.getUnreadCount(user.id)
  }
}
