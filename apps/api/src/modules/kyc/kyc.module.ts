import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { KycController } from './kyc.controller'
import { KycService } from './kyc.service'

@Module({
  imports: [DatabaseModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
