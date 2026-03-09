import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { subscriptions, type Subscription } from '../../database/schema'
import {
  type SubscriptionPlan,
  type BillingInterval,
  type SubscriptionMeResponse,
  type SubscriptionCheckoutResponse,
  type SubscriptionPortalResponse,
  type PlanFeatures,
  PLAN_HIERARCHY,
  STRIPE_PRICE_IDS,
  FREE_MALE_FEATURES,
  FREE_FEMALE_FEATURES,
  PREMIUM_FEATURES,
  PLATINUM_FEATURES,
} from '@spark/types'

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // ── Queries ─────────────────────────────────────────────────

  /**
   * Get current subscription status + resolved features for a user.
   * Returns 'none' status and free-tier features if no subscription exists.
   */
  async getCurrentSubscription(userId: string, gender?: string): Promise<SubscriptionMeResponse> {
    try {
      const [sub] = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      if (!sub || sub.plan === 'free') {
        const features = this.resolveFreeFeatures(gender)
        return {
          plan: 'free',
          status: 'none',
          billingInterval: null,
          currentPeriodEnd: null,
          cancelledAt: null,
          features,
        }
      }

      const features = sub.plan === 'platinum' ? PLATINUM_FEATURES : PREMIUM_FEATURES

      return {
        plan: sub.plan,
        status: sub.status as SubscriptionMeResponse['status'],
        billingInterval: sub.billingInterval as BillingInterval | null,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
        cancelledAt: sub.cancelledAt?.toISOString() ?? null,
        features,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting subscription for user: ${userId}`, error)
      throw error
    }
  }

  // ── Stripe Checkout ─────────────────────────────────────────

  /**
   * Create a Stripe Checkout Session for subscription purchase/upgrade.
   * Returns the checkout URL for the client to redirect to.
   */
  async createCheckoutSession(
    userId: string,
    planId: SubscriptionPlan,
    billingCycle: BillingInterval,
  ): Promise<SubscriptionCheckoutResponse> {
    if (planId === 'free') {
      throw new BadRequestException('Cannot checkout for the free plan')
    }

    const priceKey = `${planId}_${billingCycle}` as keyof typeof STRIPE_PRICE_IDS
    const stripePriceId = STRIPE_PRICE_IDS[priceKey]

    if (!stripePriceId) {
      throw new BadRequestException(`Invalid plan/billing combination: ${planId}/${billingCycle}`)
    }

    // Check if user already has an active subscription at this level or higher
    const [existing] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    if (existing && existing.status === 'active') {
      const existingLevel = PLAN_HIERARCHY[existing.plan] ?? 0
      const requestedLevel = PLAN_HIERARCHY[planId] ?? 0

      if (requestedLevel <= existingLevel) {
        throw new BadRequestException(
          `You already have an active ${existing.plan} subscription. Use the portal to manage it.`,
        )
      }
    }

    // TODO: Create actual Stripe Checkout Session when Stripe is integrated
    // const session = await stripe.checkout.sessions.create({
    //   customer: stripeCustomerId,
    //   line_items: [{ price: stripePriceId, quantity: 1 }],
    //   mode: 'subscription',
    //   success_url: `${process.env.WEB_URL}/profile/subscription?success=true`,
    //   cancel_url: `${process.env.WEB_URL}/profile/subscription?cancelled=true`,
    //   metadata: { userId, planId, billingCycle },
    // })

    this.logger.log(
      `Checkout session created: user=${userId}, plan=${planId}, billing=${billingCycle}, price=${stripePriceId}`,
    )

    return {
      checkoutUrl: `/profile/subscription?checkout=pending&plan=${planId}&billing=${billingCycle}`,
    }
  }

  // ── Stripe Customer Portal ──────────────────────────────────

  /**
   * Create a Stripe Customer Portal session for subscription management.
   * Users can update payment method, cancel, or change plan here.
   */
  async createPortalSession(userId: string): Promise<SubscriptionPortalResponse> {
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    if (!sub || !sub.stripeCustomerId) {
      throw new BadRequestException('No active subscription found. Subscribe first.')
    }

    // TODO: Create actual Stripe Portal Session when Stripe is integrated
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: sub.stripeCustomerId,
    //   return_url: `${process.env.WEB_URL}/profile/subscription`,
    // })

    this.logger.log(
      `Portal session created: user=${userId}, stripeCustomer=${sub.stripeCustomerId}`,
    )

    return {
      portalUrl: `/profile/subscription?portal=pending`,
    }
  }

  // ── Cancel ──────────────────────────────────────────────────

  /**
   * Cancel a subscription. Marks it as cancelled in our DB and
   * triggers cancellation via Stripe API.
   * Access continues until currentPeriodEnd.
   */
  async cancelSubscription(userId: string): Promise<{ cancelledAt: string }> {
    try {
      const [sub] = await this.db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      if (!sub) {
        throw new NotFoundException('No subscription found')
      }

      if (sub.status === 'cancelled') {
        throw new BadRequestException('Subscription is already cancelled')
      }

      if (sub.plan === 'free') {
        throw new BadRequestException('Cannot cancel the free plan')
      }

      // TODO: Cancel via Stripe API when integrated
      // await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      //   cancel_at_period_end: true,
      // })

      const now = new Date()

      await this.db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: now,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, sub.id))

      this.logger.log(`Subscription cancelled: user=${userId}, plan=${sub.plan}`)

      return { cancelledAt: now.toISOString() }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error cancelling subscription for user: ${userId}`, error)
      throw error
    }
  }

  // ── Stripe Webhook Handlers ─────────────────────────────────

  /**
   * Handle checkout.session.completed — activate subscription in our DB.
   */
  async handleCheckoutCompleted(event: {
    customerId: string
    subscriptionId: string
    userId: string
    planId: SubscriptionPlan
    billingCycle: BillingInterval
    currentPeriodStart: Date
    currentPeriodEnd: Date
  }): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, event.userId))
          .limit(1)

        if (existing) {
          // Update existing subscription row
          await tx
            .update(subscriptions)
            .set({
              plan: event.planId,
              status: 'active',
              billingInterval: event.billingCycle,
              stripeCustomerId: event.customerId,
              stripeSubscriptionId: event.subscriptionId,
              currentPeriodStart: event.currentPeriodStart,
              currentPeriodEnd: event.currentPeriodEnd,
              cancelledAt: null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, existing.id))
        } else {
          // Create new subscription row
          await tx.insert(subscriptions).values({
            userId: event.userId,
            plan: event.planId,
            status: 'active',
            billingInterval: event.billingCycle,
            stripeCustomerId: event.customerId,
            stripeSubscriptionId: event.subscriptionId,
            currentPeriodStart: event.currentPeriodStart,
            currentPeriodEnd: event.currentPeriodEnd,
          })
        }
      })

      this.logger.log(`Subscription activated: user=${event.userId}, plan=${event.planId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error handling checkout completed for user: ${event.userId}`, error)
      throw error
    }
  }

  /**
   * Handle customer.subscription.updated — sync plan/status changes from Stripe.
   */
  async handleSubscriptionUpdated(event: {
    stripeSubscriptionId: string
    plan: SubscriptionPlan
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelledAt: Date | null
  }): Promise<void> {
    try {
      await this.db
        .update(subscriptions)
        .set({
          plan: event.plan,
          status: event.status as Subscription['status'],
          currentPeriodStart: event.currentPeriodStart,
          currentPeriodEnd: event.currentPeriodEnd,
          cancelledAt: event.cancelledAt,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, event.stripeSubscriptionId))

      this.logger.log(
        `Subscription updated: stripe=${event.stripeSubscriptionId}, plan=${event.plan}, status=${event.status}`,
      )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(
        `Error handling subscription update: stripe=${event.stripeSubscriptionId}`,
        error,
      )
      throw error
    }
  }

  /**
   * Handle customer.subscription.deleted — mark subscription as expired.
   */
  async handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
    try {
      await this.db
        .update(subscriptions)
        .set({
          status: 'expired',
          plan: 'free',
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))

      this.logger.log(`Subscription expired: stripe=${stripeSubscriptionId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(
        `Error handling subscription deletion: stripe=${stripeSubscriptionId}`,
        error,
      )
      throw error
    }
  }

  /**
   * Handle invoice.payment_failed — mark subscription as past_due.
   */
  async handlePaymentFailed(stripeSubscriptionId: string): Promise<void> {
    try {
      await this.db
        .update(subscriptions)
        .set({
          status: 'past_due',
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))

      this.logger.log(`Payment failed: stripe=${stripeSubscriptionId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error handling payment failure: stripe=${stripeSubscriptionId}`, error)
      throw error
    }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private resolveFreeFeatures(gender?: string): PlanFeatures {
    if (gender === 'female' || gender === 'non_binary') {
      return FREE_FEMALE_FEATURES
    }
    return FREE_MALE_FEATURES
  }
}
