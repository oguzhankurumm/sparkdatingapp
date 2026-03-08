import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import {
  type PlanFeatures,
  type Gender,
  type SubscriptionPlan,
  FREE_MALE_FEATURES,
  FREE_FEMALE_FEATURES,
  PREMIUM_FEATURES,
  PLATINUM_FEATURES,
} from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { subscriptions } from '../../database/schema'

@Injectable()
export class PlanFeaturesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Get effective features for a user based on gender + subscription plan.
   * Women and non-binary users get premium-like features for free
   * to maintain healthy gender ratios on the platform.
   */
  async getEffectiveFeatures(userId: string, gender: Gender): Promise<PlanFeatures> {
    const plan = await this.getUserPlan(userId)

    // Platinum/Premium overrides gender benefits
    if (plan === 'platinum') return PLATINUM_FEATURES
    if (plan === 'premium') return PREMIUM_FEATURES

    // Free tier: women + non-binary get boosted features
    if (gender === 'female' || gender === 'non_binary') {
      return FREE_FEMALE_FEATURES
    }

    return FREE_MALE_FEATURES
  }

  /**
   * Get the user's current active subscription plan.
   * Returns 'free' if no active subscription exists.
   */
  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const [sub] = await this.db
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    if (!sub || sub.plan === 'free') return 'free'
    return sub.plan
  }
}
