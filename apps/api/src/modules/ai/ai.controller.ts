import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PlanGuard } from '../../common/guards/plan.guard'
import { CurrentUser, RequiresPlan } from '../../common/decorators'
import type { IcebreakerService } from './icebreaker.service'
import type { ProfileAnalyzerService } from './profile-analyzer.service'
import type { MessagingCoachService } from './messaging-coach.service'
import { icebreakerSchema, messagingCoachSchema } from './dto'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly icebreakerService: IcebreakerService,
    private readonly profileAnalyzerService: ProfileAnalyzerService,
    private readonly messagingCoachService: MessagingCoachService,
  ) {}

  @Post('icebreaker')
  async getIcebreakers(@CurrentUser('id') userId: string, @Body() body: { matchId: string }) {
    const { matchId } = icebreakerSchema.parse(body)
    return this.icebreakerService.generateIcebreakers(userId, matchId)
  }

  @Get('profile-analysis')
  @UseGuards(PlanGuard)
  @RequiresPlan('platinum')
  async analyzeProfile(@CurrentUser('id') userId: string) {
    return this.profileAnalyzerService.analyzeProfile(userId)
  }

  @Post('messaging-coach')
  @UseGuards(PlanGuard)
  @RequiresPlan('platinum')
  async messagingCoach(@CurrentUser('id') userId: string, @Body() body: unknown) {
    const input = messagingCoachSchema.parse(body)
    return this.messagingCoachService.getSuggestions(userId, input)
  }
}
