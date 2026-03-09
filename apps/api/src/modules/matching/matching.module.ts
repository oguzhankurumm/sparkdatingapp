import { Module } from '@nestjs/common'
import { MatchingController } from './matching.controller'
import { MatchingService } from './matching.service'
import { MatchingCronService } from './matching-cron.service'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [WalletModule],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingCronService],
  exports: [MatchingService],
})
export class MatchingModule {}
