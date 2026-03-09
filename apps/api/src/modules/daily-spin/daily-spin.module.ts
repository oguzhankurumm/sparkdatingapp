import { Module } from '@nestjs/common'
import { DailySpinController } from './daily-spin.controller'
import { DailySpinService } from './daily-spin.service'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [WalletModule],
  controllers: [DailySpinController],
  providers: [DailySpinService],
  exports: [DailySpinService],
})
export class DailySpinModule {}
