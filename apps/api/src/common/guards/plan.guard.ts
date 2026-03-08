import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { Injectable, ForbiddenException } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { SubscriptionPlan } from '../decorators/requires-plan.decorator'
import { PLAN_KEY } from '../decorators/requires-plan.decorator'

const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  premium: 1,
  platinum: 2,
}

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlans = this.reflector.getAllAndOverride<SubscriptionPlan[]>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredPlans || requiredPlans.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const userPlan: SubscriptionPlan = request.user?.plan ?? 'free'
    const userLevel = PLAN_HIERARCHY[userPlan]

    const hasAccess = requiredPlans.some((plan) => userLevel >= PLAN_HIERARCHY[plan])

    if (!hasAccess) {
      throw new ForbiddenException(`This feature requires ${requiredPlans.join(' or ')} plan`)
    }

    return true
  }
}
