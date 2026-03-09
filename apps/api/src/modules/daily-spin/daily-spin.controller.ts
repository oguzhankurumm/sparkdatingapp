import { Controller, Get, Post, Body } from '@nestjs/common'
import type { DailySpinService } from './daily-spin.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'

@Controller('daily-spin')
export class DailySpinController {
  constructor(private readonly dailySpinService: DailySpinService) {}

  /** GET /api/daily-spin/status — get today's spin status and remaining spins */
  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    return this.dailySpinService.getSpinStatus(user.id)
  }

  /** GET /api/daily-spin/rewards — get the reward table for frontend wheel rendering */
  @Get('rewards')
  getRewardTable() {
    return this.dailySpinService.getRewardTable()
  }

  /** POST /api/daily-spin/free — execute the daily free spin */
  @Post('free')
  async spinFree(@CurrentUser() user: User) {
    return this.dailySpinService.spinFree(user.id)
  }

  /** POST /api/daily-spin/ad — execute an ad-reward spin */
  @Post('ad')
  async spinAd(
    @CurrentUser() user: User,
    @Body('adVerificationToken') adVerificationToken: string,
  ) {
    return this.dailySpinService.spinAd(user.id, adVerificationToken)
  }
}
