import { Module } from '@nestjs/common'
import { VideoCallsController } from './video-calls.controller'
import { VideoCallsService } from './video-calls.service'
import { WalletModule } from '../wallet/wallet.module'
import { MatchingModule } from '../matching/matching.module'

@Module({
  imports: [WalletModule, MatchingModule],
  controllers: [VideoCallsController],
  providers: [VideoCallsService],
  exports: [VideoCallsService],
})
export class VideoCallsModule {}
