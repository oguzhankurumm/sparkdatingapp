import { Module } from '@nestjs/common'
import { TablesController } from './tables.controller'
import { TablesService } from './tables.service'
import { WalletModule } from '../wallet/wallet.module'
import { MatchingModule } from '../matching/matching.module'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'

@Module({
  imports: [WalletModule, MatchingModule, SubscriptionsModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
