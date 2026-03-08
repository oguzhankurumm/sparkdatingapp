import { Controller } from '@nestjs/common'
import type { LeaderboardService } from './leaderboard.service'

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}
}
