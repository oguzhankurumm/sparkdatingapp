import { Controller, Get, Post, Body } from '@nestjs/common'
import type { SafetyService } from './safety.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'
import type { TriggerPanicInput } from './dto'

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  /** POST /api/safety/panic — trigger emergency panic */
  @Post('panic')
  async triggerPanic(@CurrentUser() user: User, @Body() body: TriggerPanicInput) {
    return this.safetyService.triggerPanic(user, body)
  }

  /** POST /api/safety/resolve — user confirms they are safe */
  @Post('resolve')
  async resolvePanic(@CurrentUser() user: User) {
    return this.safetyService.resolvePanic(user.id)
  }

  /** GET /api/safety/status — check for active panic event */
  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    const event = await this.safetyService.getActivePanic(user.id)
    return { active: !!event, event }
  }
}
