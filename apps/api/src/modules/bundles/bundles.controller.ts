import { Controller, Get, Post, Body, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { BundlesService } from './bundles.service'
import type { BundleTier } from '@spark/types'

@Controller('bundles')
@UseGuards(JwtAuthGuard)
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  /** GET /api/bundles — list all bundle packages */
  @Get()
  getPackages() {
    return this.bundlesService.getPackages()
  }

  /** POST /api/bundles/purchase — initiate bundle checkout */
  @Post('purchase')
  async purchase(@CurrentUser('id') userId: string, @Body('bundleId') bundleId: BundleTier) {
    if (!bundleId) {
      throw new BadRequestException('bundleId is required')
    }
    return this.bundlesService.initiatePurchase(userId, bundleId)
  }
}
