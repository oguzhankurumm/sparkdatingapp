import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TranslateController } from './translate.controller'
import { TranslateService } from './translate.service'

@Module({
  imports: [ConfigModule],
  controllers: [TranslateController],
  providers: [TranslateService],
  exports: [TranslateService],
})
export class TranslateModule {}
