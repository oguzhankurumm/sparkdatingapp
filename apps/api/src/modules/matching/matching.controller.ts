import { Controller, Get, Post, Param } from '@nestjs/common'
import type { MatchingService } from './matching.service'
import { CurrentUser } from '../../common/decorators'
import type { User } from '../../database/schema'

@Controller('matches')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /** GET /api/matches — list all active matches for the authenticated user */
  @Get()
  async getMatches(@CurrentUser() user: User) {
    return this.matchingService.getMatches(user.id)
  }

  /** GET /api/matches/:matchId — get a single match by ID */
  @Get(':matchId')
  async getMatch(@Param('matchId') matchId: string, @CurrentUser() user: User) {
    return this.matchingService.getMatchById(matchId, user.id)
  }

  /** POST /api/matches/:matchId/unmatch — unmatch from a match */
  @Post(':matchId/unmatch')
  async unmatch(@Param('matchId') matchId: string, @CurrentUser() user: User) {
    return this.matchingService.unmatch(matchId, user.id)
  }

  /** POST /api/matches/:matchId/rematch — reactivate an expired match (50 tokens) */
  @Post(':matchId/rematch')
  async rematch(@Param('matchId') matchId: string, @CurrentUser() user: User) {
    return this.matchingService.rematch(matchId, user.id)
  }
}
