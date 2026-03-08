import { SetMetadata } from '@nestjs/common'

export const PLAN_KEY = 'requiredPlan'

export type SubscriptionPlan = 'free' | 'premium' | 'platinum'

export const RequiresPlan = (...plans: SubscriptionPlan[]) => SetMetadata(PLAN_KEY, plans)
