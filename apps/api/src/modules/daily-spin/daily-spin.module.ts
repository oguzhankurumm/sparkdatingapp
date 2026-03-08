import { Module } from '@nestjs/common'
import { DailySpinController } from './daily-spin.controller'
import { DailySpinService } from './daily-spin.service'

@Module({
  controllers: [DailySpinController],
  providers: [DailySpinService],
  exports: [DailySpinService],
})
export class DailySpinModule {}
