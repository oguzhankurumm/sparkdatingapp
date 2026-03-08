import { Module } from '@nestjs/common'
import { LiveStreamController } from './live-stream.controller'
import { LiveStreamService } from './live-stream.service'

@Module({
  controllers: [LiveStreamController],
  providers: [LiveStreamService],
  exports: [LiveStreamService],
})
export class LiveStreamModule {}
