import { Module, Global } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { MatchingModule } from '../matching/matching.module'
import { AiService } from './ai.service'
import { IcebreakerService } from './icebreaker.service'
import { AiController } from './ai.controller'

@Global()
@Module({
  imports: [DatabaseModule, MatchingModule],
  controllers: [AiController],
  providers: [AiService, IcebreakerService],
  exports: [AiService],
})
export class AiModule {}
