import { Module } from '@nestjs/common'
import { SubscriptionsController } from './subscriptions.controller'
import { SubscriptionsService } from './subscriptions.service'
import { PlanFeaturesService } from './plan-features.service'

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PlanFeaturesService],
  exports: [SubscriptionsService, PlanFeaturesService],
})
export class SubscriptionsModule {}
