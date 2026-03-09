import { Controller, Get, Post, Body } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators'
import type { SafetyService } from './safety.service'

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    const event = await this.safetyService.getActiveEvent(userId)
    return { active: !!event, event }
  }

  @Post('panic')
  async triggerPanic(
    @CurrentUser('id') userId: string,
    @Body() body: { latitude?: string; longitude?: string; deviceInfo?: Record<string, unknown> },
  ) {
    const result = await this.safetyService.triggerPanic(userId, {
      latitude: body.latitude,
      longitude: body.longitude,
      deviceInfo: body.deviceInfo ? JSON.stringify(body.deviceInfo) : undefined,
    })
    return result
  }

  @Post('resolve')
  async resolvePanic(@CurrentUser('id') userId: string) {
    const result = await this.safetyService.resolvePanic(userId)
    return result
  }
}
