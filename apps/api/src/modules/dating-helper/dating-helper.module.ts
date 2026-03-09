import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { DatingHelperController } from './dating-helper.controller'
import { DatingHelperService } from './dating-helper.service'

@Module({
  imports: [DatabaseModule],
  controllers: [DatingHelperController],
  providers: [DatingHelperService],
  exports: [DatingHelperService],
})
export class DatingHelperModule {}
