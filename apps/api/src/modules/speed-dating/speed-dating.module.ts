import { Module } from '@nestjs/common'
import { SpeedDatingController } from './speed-dating.controller'
import { SpeedDatingService } from './speed-dating.service'

@Module({
  controllers: [SpeedDatingController],
  providers: [SpeedDatingService],
  exports: [SpeedDatingService],
})
export class SpeedDatingModule {}
