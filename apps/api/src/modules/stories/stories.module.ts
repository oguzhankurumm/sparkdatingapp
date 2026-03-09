import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../../database/database.module'
import { StoriesController } from './stories.controller'
import { StoriesService } from './stories.service'

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
