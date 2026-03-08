import { Module } from '@nestjs/common'
import { ZodiacController } from './zodiac.controller'
import { ZodiacService } from './zodiac.service'

@Module({
  controllers: [ZodiacController],
  providers: [ZodiacService],
  exports: [ZodiacService],
})
export class ZodiacModule {}
