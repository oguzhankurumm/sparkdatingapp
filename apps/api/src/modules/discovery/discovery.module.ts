import { Module } from '@nestjs/common'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { DiscoveryController } from './discovery.controller'
import { DiscoveryService } from './discovery.service'
import { DiscoveryScoringService } from './discovery-scoring.service'

@Module({
  imports: [SubscriptionsModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService, DiscoveryScoringService],
  exports: [DiscoveryService, DiscoveryScoringService],
})
export class DiscoveryModule {}
