import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import type { VideoCallsService } from './video-calls.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import { z } from 'zod'

const initiateCallSchema = z.object({
  receiverId: z.string().uuid(),
  callType: z.enum(['video', 'audio']).default('video'),
})

const setCallRateSchema = z.object({
  rate: z.number().int().min(10).max(100),
})

const setReadySchema = z.object({
  isReady: z.boolean(),
})

@Controller('video-calls')
@UseGuards(JwtAuthGuard)
export class VideoCallsController {
  constructor(private readonly videoCallsService: VideoCallsService) {}

  /** POST /api/video-calls/initiate — start a call */
  @Post('initiate')
  async initiateCall(@CurrentUser('id') userId: string, @Body() body: unknown) {
    const parsed = initiateCallSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }
    return this.videoCallsService.initiateCall(userId, parsed.data.receiverId, parsed.data.callType)
  }

  /** PATCH /api/video-calls/:id/accept — accept an incoming call */
  @Patch(':id/accept')
  async acceptCall(@Param('id') callId: string, @CurrentUser('id') userId: string) {
    return this.videoCallsService.acceptCall(callId, userId)
  }

  /** PATCH /api/video-calls/:id/decline — decline an incoming call */
  @Patch(':id/decline')
  async declineCall(@Param('id') callId: string, @CurrentUser('id') userId: string) {
    return this.videoCallsService.declineCall(callId, userId)
  }

  /** PATCH /api/video-calls/:id/end — end an active call */
  @Patch(':id/end')
  async endCall(@Param('id') callId: string, @CurrentUser('id') userId: string) {
    return this.videoCallsService.endCall(callId, userId)
  }

  /** GET /api/video-calls/history — get call history */
  @Get('history')
  async getCallHistory(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.videoCallsService.getCallHistory(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    )
  }

  /** GET /api/video-calls/ready-users — users available for calls */
  @Get('ready-users')
  async getReadyForCallUsers(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.videoCallsService.getReadyForCallUsers(
      userId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    )
  }

  /** PATCH /api/video-calls/ready — toggle ready for call status */
  @Patch('ready')
  async setReadyForCall(@CurrentUser('id') userId: string, @Body() body: unknown) {
    const parsed = setReadySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }
    return this.videoCallsService.setReadyForCall(userId, parsed.data.isReady)
  }

  /** PATCH /api/video-calls/rate — update call rate */
  @Patch('rate')
  async setCallRate(@CurrentUser('id') userId: string, @Body() body: unknown) {
    const parsed = setCallRateSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors)
    }
    return this.videoCallsService.setCallRate(userId, parsed.data.rate)
  }
}
