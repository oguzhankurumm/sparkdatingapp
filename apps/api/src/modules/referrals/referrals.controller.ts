import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { ReferralsService } from './referrals.service'

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * GET /referrals/code
   * Get or generate the user's unique referral code.
   */
  @Get('code')
  @UseGuards(JwtAuthGuard)
  async getCode(@CurrentUser('id') userId: string) {
    return this.referralsService.getOrCreateCode(userId)
  }

  /**
   * POST /referrals/apply
   * Apply a referral code during/after registration.
   */
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async apply(@CurrentUser('id') userId: string, @Body() body: { referralCode: string }) {
    return this.referralsService.applyCode(userId, body.referralCode)
  }
}
