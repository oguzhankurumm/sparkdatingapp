import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { BoostService } from './boost.service'

@Controller('boost')
export class BoostController {
  constructor(private readonly boostService: BoostService) {}

  /** GET /api/boost/types — list available boost packages */
  @Get('types')
  @UseGuards(JwtAuthGuard)
  getBoostTypes() {
    return this.boostService.getBoostTypes()
  }

  /** GET /api/boost/active — get currently active boost */
  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveBoost(@CurrentUser('id') userId: string) {
    const boost = await this.boostService.getActiveBoost(userId)
    if (!boost) return { active: false }

    return {
      active: true,
      boostId: boost.id,
      boostType: boost.boostType,
      multiplier: boost.multiplier,
      expiresAt: boost.expiresAt.toISOString(),
    }
  }

  /** POST /api/boost/purchase — purchase a profile boost */
  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchaseBoost(@CurrentUser('id') userId: string, @Body() body: { boostType: string }) {
    return this.boostService.purchaseBoost(userId, body.boostType)
  }

  /** GET /api/boost/history — past boost purchases */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getBoostHistory(@CurrentUser('id') userId: string) {
    return this.boostService.getBoostHistory(userId)
  }
}
