import { Module } from '@nestjs/common'
import { WalletModule } from '../wallet/wallet.module'
import { BoostController } from './boost.controller'
import { BoostService } from './boost.service'

@Module({
  imports: [WalletModule],
  controllers: [BoostController],
  providers: [BoostService],
  exports: [BoostService],
})
export class BoostModule {}
