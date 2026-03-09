import { Module } from '@nestjs/common'
import { IcebreakerController } from './icebreaker.controller'
import { IcebreakerService } from './icebreaker.service'

@Module({
  controllers: [IcebreakerController],
  providers: [IcebreakerService],
  exports: [IcebreakerService],
})
export class IcebreakerModule {}
