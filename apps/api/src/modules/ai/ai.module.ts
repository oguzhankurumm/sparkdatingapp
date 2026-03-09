import { Module, Global } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { MatchingModule } from '../matching/matching.module'
import { AiService } from './ai.service'
import { IcebreakerService } from './icebreaker.service'
import { ProfileAnalyzerService } from './profile-analyzer.service'
import { MessagingCoachService } from './messaging-coach.service'
import { CompatibilityScoreService } from './compatibility-score.service'
import { DatePlannerService } from './date-planner.service'
import { AiController } from './ai.controller'

@Global()
@Module({
  imports: [DatabaseModule, MatchingModule],
  controllers: [AiController],
  providers: [
    AiService,
    IcebreakerService,
    ProfileAnalyzerService,
    MessagingCoachService,
    CompatibilityScoreService,
    DatePlannerService,
  ],
  exports: [AiService],
})
export class AiModule {}
