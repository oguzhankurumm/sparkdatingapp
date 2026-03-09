import { Module } from '@nestjs/common'
import { BundlesController } from './bundles.controller'
import { BundlesService } from './bundles.service'
import { WalletModule } from '../wallet/wallet.module'

@Module({
  imports: [WalletModule],
  controllers: [BundlesController],
  providers: [BundlesService],
  exports: [BundlesService],
})
export class BundlesModule {}
