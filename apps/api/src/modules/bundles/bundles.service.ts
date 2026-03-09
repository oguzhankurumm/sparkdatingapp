import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import type { WalletService } from '../wallet/wallet.service'
import { BUNDLE_PACKAGES, type BundleTier, type BundlePackage } from '@spark/types'

@Injectable()
export class BundlesService {
  private readonly logger = new Logger(BundlesService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  /**
   * List all available bundle packages.
   */
  getPackages(): BundlePackage[] {
    return BUNDLE_PACKAGES
  }

  /**
   * Initiate bundle purchase via Stripe Checkout.
   * A bundle = subscription plan + bonus tokens at a discounted price.
   * After successful payment (Stripe webhook), the subscription is activated
   * and bonus tokens are credited to the user's wallet.
   */
  async initiatePurchase(userId: string, bundleId: BundleTier): Promise<{ checkoutUrl: string }> {
    const bundle = BUNDLE_PACKAGES.find((b) => b.id === bundleId)
    if (!bundle) {
      throw new BadRequestException(`Invalid bundle: ${bundleId}`)
    }

    // TODO: Create Stripe Checkout Session with:
    // - Subscription line item for the plan
    // - metadata.bundleId = bundleId
    // - metadata.userId = userId
    // - metadata.bonusTokens = bundle.bonusTokens
    // After payment, webhook will:
    //   1. Activate the subscription
    //   2. Credit bonusTokens via walletService.creditTokens()
    this.logger.log(
      `Bundle purchase initiated: user=${userId}, bundle=${bundleId}, ` +
        `plan=${bundle.plan}/${bundle.billingInterval}, ` +
        `bonusTokens=${bundle.bonusTokens}, price=$${bundle.priceUsd / 100}`,
    )

    return {
      checkoutUrl: `/wallet/purchase/pending?bundle=${bundleId}`,
    }
  }

  /**
   * Fulfill a bundle purchase after Stripe webhook confirms payment.
   * Credits the bonus tokens to the user's wallet.
   * Called by the Stripe webhook handler — NOT by the client directly.
   */
  async fulfillBundlePurchase(userId: string, bundleId: BundleTier): Promise<void> {
    try {
      const bundle = BUNDLE_PACKAGES.find((b) => b.id === bundleId)
      if (!bundle) {
        throw new Error(`Unknown bundle tier during fulfillment: ${bundleId}`)
      }

      await this.walletService.creditTokens(
        userId,
        bundle.bonusTokens,
        'bundle_bonus',
        `${bundle.name} — ${bundle.bonusTokens} bonus tokens`,
      )

      this.logger.log(
        `Bundle fulfilled: user=${userId}, bundle=${bundleId}, credited=${bundle.bonusTokens} tokens`,
      )
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to fulfill bundle: user=${userId}, bundle=${bundleId}`, error)
      throw error
    }
  }
}
