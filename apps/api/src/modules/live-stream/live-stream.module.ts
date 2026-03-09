import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { DatabaseModule } from '../../database/database.module'
import { LiveStreamController } from './live-stream.controller'
import { LiveStreamService } from './live-stream.service'
import { LiveStreamGateway } from './live-stream.gateway'

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [LiveStreamController],
  providers: [LiveStreamService, LiveStreamGateway],
  exports: [LiveStreamService, LiveStreamGateway],
})
export class LiveStreamModule {}
