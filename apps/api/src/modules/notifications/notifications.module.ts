import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  imports: [JwtModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    // Allow service to reference gateway via string token (breaks circular ref)
    {
      provide: 'NotificationsGateway',
      useExisting: NotificationsGateway,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
