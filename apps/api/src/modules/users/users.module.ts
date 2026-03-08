import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { GdprController } from './gdpr.controller'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController, GdprController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
