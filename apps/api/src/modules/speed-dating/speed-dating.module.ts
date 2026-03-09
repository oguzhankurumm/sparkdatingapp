import { Module } from '@nestjs/common'
import { WalletModule } from '../wallet/wallet.module'
import { MatchingModule } from '../matching/matching.module'
import { SpeedDatingController } from './speed-dating.controller'
import { SpeedDatingService } from './speed-dating.service'

@Module({
  imports: [WalletModule, MatchingModule],
  controllers: [SpeedDatingController],
  providers: [SpeedDatingService],
  exports: [SpeedDatingService],
})
export class SpeedDatingModule {}
