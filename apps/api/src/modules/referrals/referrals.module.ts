import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { WalletModule } from '../wallet/wallet.module'
import { ReferralsController } from './referrals.controller'
import { ReferralsService } from './referrals.service'

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
