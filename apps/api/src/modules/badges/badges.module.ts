import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { WalletModule } from '../wallet/wallet.module'
import { BadgesController } from './badges.controller'
import { BadgesService } from './badges.service'

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
