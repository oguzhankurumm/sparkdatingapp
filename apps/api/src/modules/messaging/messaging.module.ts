import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { MessagingController } from './messaging.controller'
import { MessagingService } from './messaging.service'
import { MessagingGateway } from './messaging.gateway'
import { MatchingModule } from '../matching/matching.module'
import { TranslateModule } from '../translate/translate.module'
import { ModerationModule } from '../moderation/moderation.module'

@Module({
  imports: [
    MatchingModule,
    TranslateModule,
    ModerationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
