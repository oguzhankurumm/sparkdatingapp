import { Controller, Get, Query } from '@nestjs/common'
import type { DiscoveryService } from './discovery.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /** GET /api/discovery/feed — scored discovery feed */
  @Get('feed')
  async getFeed(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.discoveryService.getFeed(user, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }

  /** GET /api/discovery/features — user's effective plan features */
  @Get('features')
  async getFeatures(@CurrentUser() user: User) {
    return this.discoveryService.getUserFeatures(user.id, user.gender)
  }

  /** GET /api/discovery/trending — top profiles from the last 7 days */
  @Get('trending')
  async getTrending(@CurrentUser() user: User, @Query('limit') limit?: string) {
    return this.discoveryService.getTrending(user.id, limit ? parseInt(limit, 10) : undefined)
  }

  /** GET /api/discovery/ready-to-call — users active in last 30 minutes */
  @Get('ready-to-call')
  async getReadyToCall(@CurrentUser() user: User) {
    return this.discoveryService.getReadyToCall(user)
  }

  /** GET /api/discovery/nearby — users near the viewer for map view */
  @Get('nearby')
  async getNearbyUsers(@CurrentUser() user: User) {
    return this.discoveryService.getNearbyUsers(user)
  }
}
