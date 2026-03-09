import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { LeaderboardService } from './leaderboard.service'
import type { LeaderboardCategory } from '@spark/types'

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /**
   * GET /leaderboard/:category
   * Fetch weekly leaderboard for a category (gifters, streamers, matchers, streakers).
   */
  @Get(':category')
  @UseGuards(JwtAuthGuard)
  async getLeaderboard(
    @CurrentUser('id') userId: string,
    @Param('category') category: LeaderboardCategory,
  ) {
    return this.leaderboardService.getLeaderboard(category, userId)
  }
}
