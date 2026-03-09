import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { GdprController } from './gdpr.controller'
import { UsersService } from './users.service'
import { ZodiacModule } from '../zodiac/zodiac.module'

@Module({
  imports: [ZodiacModule],
  controllers: [UsersController, GdprController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
