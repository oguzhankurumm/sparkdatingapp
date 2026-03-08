import { Module } from '@nestjs/common'
import { DatingHelperController } from './dating-helper.controller'
import { DatingHelperService } from './dating-helper.service'

@Module({
  controllers: [DatingHelperController],
  providers: [DatingHelperService],
  exports: [DatingHelperService],
})
export class DatingHelperModule {}
