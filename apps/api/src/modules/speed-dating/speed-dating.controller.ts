import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { SpeedDatingService } from './speed-dating.service'

@Controller('speed-dating')
@UseGuards(JwtAuthGuard)
export class SpeedDatingController {
  constructor(private readonly speedDatingService: SpeedDatingService) {}

  /** List events (optionally filter by status). */
  @Get('events')
  listEvents(@Query('status') status?: 'scheduled' | 'active') {
    return this.speedDatingService.listEvents(status)
  }

  /** Get a single event. */
  @Get('events/:eventId')
  getEvent(@Param('eventId') eventId: string) {
    return this.speedDatingService.getEvent(eventId)
  }

  /** Join an event (deducts tokens). */
  @Post('events/:eventId/join')
  joinEvent(@CurrentUser('id') userId: string, @Param('eventId') eventId: string) {
    return this.speedDatingService.joinEvent(userId, eventId)
  }

  /** Leave an event (before it starts). */
  @Post('events/:eventId/leave')
  leaveEvent(@CurrentUser('id') userId: string, @Param('eventId') eventId: string) {
    return this.speedDatingService.leaveEvent(userId, eventId)
  }

  /** Get current round pairings. */
  @Get('events/:eventId/pairings')
  getCurrentPairings(@Param('eventId') eventId: string) {
    return this.speedDatingService.getCurrentPairings(eventId)
  }

  /** Submit a like for a partner after a round. */
  @Post('events/:eventId/like/:targetUserId')
  submitLike(
    @CurrentUser('id') userId: string,
    @Param('eventId') eventId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.speedDatingService.submitLike(userId, eventId, targetUserId)
  }

  /** Get results (mutual matches) after event completes. */
  @Get('events/:eventId/results')
  getResults(@CurrentUser('id') userId: string, @Param('eventId') eventId: string) {
    return this.speedDatingService.getResults(userId, eventId)
  }

  // --- Admin endpoints ---

  /** Start a scheduled event (admin/cron). */
  @Post('events/:eventId/start')
  startEvent(@Param('eventId') eventId: string) {
    return this.speedDatingService.startEvent(eventId)
  }

  /** Advance to next round (admin/cron). */
  @Post('events/:eventId/advance')
  advanceRound(@Param('eventId') eventId: string) {
    return this.speedDatingService.advanceRound(eventId)
  }
}
