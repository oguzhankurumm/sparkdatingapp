import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PlanGuard } from '../../common/guards/plan.guard'
import { CurrentUser, RequiresPlan } from '../../common/decorators'
import type { SubscriptionPlan } from '@spark/types'
import type { IcebreakerService } from './icebreaker.service'
import type { ProfileAnalyzerService } from './profile-analyzer.service'
import type { MessagingCoachService } from './messaging-coach.service'
import type { CompatibilityScoreService } from './compatibility-score.service'
import type { DatePlannerService } from './date-planner.service'
import {
  icebreakerSchema,
  messagingCoachSchema,
  compatibilityScoreSchema,
  datePlanSchema,
} from './dto'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly icebreakerService: IcebreakerService,
    private readonly profileAnalyzerService: ProfileAnalyzerService,
    private readonly messagingCoachService: MessagingCoachService,
    private readonly compatibilityScoreService: CompatibilityScoreService,
    private readonly datePlannerService: DatePlannerService,
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

  /** GET /api/ai/compatibility/:matchId — AI compatibility score (all plans, tiered details) */
  @Get('compatibility/:matchId')
  async getCompatibilityScore(
    @Param('matchId') matchId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('plan') userPlan: SubscriptionPlan,
  ) {
    compatibilityScoreSchema.parse({ matchId })
    return this.compatibilityScoreService.getCompatibilityScore(matchId, userId, userPlan ?? 'free')
  }

  /** POST /api/ai/date-plan — AI date planning (premium+, daily limits) */
  @Post('date-plan')
  @UseGuards(PlanGuard)
  @RequiresPlan('premium')
  async generateDatePlan(
    @CurrentUser('id') userId: string,
    @CurrentUser('plan') userPlan: SubscriptionPlan,
    @Body() body: unknown,
  ) {
    const { matchId } = datePlanSchema.parse(body)
    return this.datePlannerService.generateDatePlans(matchId, userId, userPlan ?? 'free')
  }
}
