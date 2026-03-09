import type { RawBodyRequest } from '@nestjs/common'
import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import type { Request } from 'express'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser, Public } from '../../common/decorators'
import type { SubscriptionsService } from './subscriptions.service'
import type { SubscriptionPlan, BillingInterval } from '@spark/types'

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name)

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** GET /subscriptions/me — current subscription + resolved features */
  @Get('me')
  async getCurrentSubscription(
    @CurrentUser('id') userId: string,
    @CurrentUser('gender') gender: string | undefined,
  ) {
    return this.subscriptionsService.getCurrentSubscription(userId, gender)
  }

  /** POST /subscriptions/checkout — create Stripe Checkout Session */
  @Post('checkout')
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Body('planId') planId: SubscriptionPlan,
    @Body('billingCycle') billingCycle: BillingInterval,
  ) {
    if (!planId || !billingCycle) {
      throw new BadRequestException('planId and billingCycle are required')
    }
    return this.subscriptionsService.createCheckoutSession(userId, planId, billingCycle)
  }

  /** POST /subscriptions/portal — create Stripe Customer Portal Session */
  @Post('portal')
  async createPortalSession(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.createPortalSession(userId)
  }

  /** POST /subscriptions/cancel — cancel subscription (access until period end) */
  @Post('cancel')
  async cancelSubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.cancelSubscription(userId)
  }

  /**
   * POST /subscriptions/webhooks/stripe — Stripe webhook receiver.
   * Must be @Public since Stripe calls this directly (no JWT).
   * In production, verify stripe-signature header.
   */
  @Public()
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // TODO: Verify signature with stripe.webhooks.constructEvent()
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret)

    // For now, parse body directly (placeholder until Stripe is integrated)
    const body = req.body as Record<string, unknown>
    const eventType = body.type as string

    if (!eventType) {
      throw new BadRequestException('Missing event type')
    }

    this.logger.log(`Stripe webhook received: ${eventType}`)

    switch (eventType) {
      case 'checkout.session.completed': {
        const data = body.data as Record<string, unknown>
        const object = data?.object as Record<string, unknown>
        const metadata = object?.metadata as Record<string, string>

        await this.subscriptionsService.handleCheckoutCompleted({
          customerId: object?.customer as string,
          subscriptionId: object?.subscription as string,
          userId: metadata?.userId as string,
          planId: metadata?.planId as SubscriptionPlan,
          billingCycle: metadata?.billingCycle as BillingInterval,
          currentPeriodStart: new Date((object?.current_period_start as number) * 1000),
          currentPeriodEnd: new Date((object?.current_period_end as number) * 1000),
        })
        break
      }

      case 'customer.subscription.updated': {
        const data = body.data as Record<string, unknown>
        const object = data?.object as Record<string, unknown>
        const items = object?.items as Record<string, unknown>
        const itemData = (items?.data as Record<string, unknown>[])?.[0]
        const price = itemData?.price as Record<string, unknown>

        await this.subscriptionsService.handleSubscriptionUpdated({
          stripeSubscriptionId: object?.id as string,
          plan: this.resolvePlanFromPriceId(price?.id as string),
          status: object?.status as string,
          currentPeriodStart: new Date((object?.current_period_start as number) * 1000),
          currentPeriodEnd: new Date((object?.current_period_end as number) * 1000),
          cancelledAt: object?.canceled_at ? new Date((object.canceled_at as number) * 1000) : null,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const data = body.data as Record<string, unknown>
        const object = data?.object as Record<string, unknown>
        await this.subscriptionsService.handleSubscriptionDeleted(object?.id as string)
        break
      }

      case 'invoice.payment_failed': {
        const data = body.data as Record<string, unknown>
        const object = data?.object as Record<string, unknown>
        await this.subscriptionsService.handlePaymentFailed(object?.subscription as string)
        break
      }

      default:
        this.logger.log(`Unhandled Stripe event: ${eventType}`)
    }

    return { received: true }
  }

  /**
   * POST /subscriptions/webhooks/revenuecat — RevenueCat webhook for mobile IAP.
   * Public endpoint — RevenueCat calls this directly.
   */
  @Public()
  @Post('webhooks/revenuecat')
  async handleRevenueCatWebhook(@Body() body: Record<string, unknown>) {
    // TODO: Implement RevenueCat webhook handling when mobile app is built
    this.logger.log(`RevenueCat webhook received: ${JSON.stringify(body).slice(0, 200)}`)
    return { received: true }
  }

  // ── Helpers ─────────────────────────────────────────────────

  private resolvePlanFromPriceId(priceId: string): SubscriptionPlan {
    if (priceId?.includes('platinum')) return 'platinum'
    if (priceId?.includes('premium')) return 'premium'
    return 'free'
  }
}
