import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { SafeDateService } from './safe-date.service'

@Controller('safe-date')
export class SafeDateController {
  constructor(private readonly safeDateService: SafeDateService) {}

  /** GET /api/safe-date/active — get current active session */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveSession(@CurrentUser('id') userId: string) {
    return this.safeDateService.getActiveSession(userId)
  }

  /** POST /api/safe-date/start — start a new safe-date session */
  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startSession(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      emergencyContactName: string
      emergencyContactPhone: string
      venueAddress?: string
      latitude?: string
      longitude?: string
      durationHours?: number
    },
  ) {
    return this.safeDateService.startSession(userId, body)
  }

  /** PATCH /api/safe-date/:sessionId/location — update location */
  @Patch(':sessionId/location')
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
    @Body() body: { latitude: string; longitude: string },
  ) {
    return this.safeDateService.updateLocation(userId, sessionId, body.latitude, body.longitude)
  }

  /** POST /api/safe-date/:sessionId/end — end session (I'm safe) */
  @Post(':sessionId/end')
  @UseGuards(JwtAuthGuard)
  async endSession(@CurrentUser('id') userId: string, @Param('sessionId') sessionId: string) {
    return this.safeDateService.endSession(userId, sessionId)
  }

  /** POST /api/safe-date/:sessionId/emergency — trigger emergency alert */
  @Post(':sessionId/emergency')
  @UseGuards(JwtAuthGuard)
  async triggerEmergency(@CurrentUser('id') userId: string, @Param('sessionId') sessionId: string) {
    return this.safeDateService.triggerEmergency(userId, sessionId)
  }

  /** GET /api/safe-date/public/:token — public page for emergency contact (NO auth) */
  @Get('public/:token')
  async getPublicSession(@Param('token') token: string) {
    return this.safeDateService.getPublicSession(token)
  }
}
