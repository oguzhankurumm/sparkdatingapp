import { Module } from '@nestjs/common'
import { SafeDateController } from './safe-date.controller'
import { SafeDateService } from './safe-date.service'

@Module({
  controllers: [SafeDateController],
  providers: [SafeDateService],
  exports: [SafeDateService],
})
export class SafeDateModule {}
