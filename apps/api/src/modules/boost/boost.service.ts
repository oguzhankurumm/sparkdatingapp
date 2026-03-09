import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common'
import { eq, and, gte } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { BOOST_TYPES } from '@spark/types'
import { DATABASE, type Database } from '../../database/database.module'
import { profileBoosts, type ProfileBoost } from '../../database/schema'
import type { WalletService } from '../wallet/wallet.service'

type BoostKey = keyof typeof BOOST_TYPES

@Injectable()
export class BoostService {
  private readonly logger = new Logger(BoostService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Purchase a profile boost. Deducts tokens atomically via WalletService,
   * then records the boost in `profileBoosts` table.
   */
  async purchaseBoost(
    userId: string,
    boostType: string,
  ): Promise<{ boostId: string; expiresAt: string }> {
    try {
      const config = BOOST_TYPES[boostType as BoostKey]
      if (!config) {
        throw new BadRequestException(
          `Invalid boost type: ${boostType}. Valid types: ${Object.keys(BOOST_TYPES).join(', ')}`,
        )
      }

      // Check for existing active boost
      const active = await this.getActiveBoost(userId)
      if (active) {
        throw new BadRequestException(
          'You already have an active boost. Wait for it to expire before purchasing another.',
        )
      }

      // Deduct tokens atomically (throws if insufficient balance)
      await this.walletService.deductTokens(
        userId,
        config.tokens,
        'boost_purchase',
        `Profile boost: ${boostType} (${config.multiplier}x for ${config.duration / 60} min)`,
      )

      // Record the boost
      const expiresAt = new Date(Date.now() + config.duration * 1000)

      const [boost] = await this.db
        .insert(profileBoosts)
        .values({
          userId,
          boostType,
          multiplier: config.multiplier,
          tokensCost: config.tokens,
          expiresAt,
        })
        .returning()

      if (!boost) throw new Error('Failed to create boost record')

      this.logger.log(
        `Boost purchased: userId=${userId}, type=${boostType}, expiresAt=${expiresAt.toISOString()}`,
      )

      return {
        boostId: boost.id,
        expiresAt: expiresAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error purchasing boost for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get the user's currently active boost (if any).
   * Returns null if no active boost or if the boost has expired.
   */
  async getActiveBoost(userId: string): Promise<ProfileBoost | null> {
    const now = new Date()

    const [boost] = await this.db
      .select()
      .from(profileBoosts)
      .where(and(eq(profileBoosts.userId, userId), gte(profileBoosts.expiresAt, now)))
      .limit(1)

    return boost ?? null
  }

  /**
   * Get boost purchase history for a user (most recent first).
   */
  async getBoostHistory(
    userId: string,
    limit = 20,
  ): Promise<
    {
      id: string
      boostType: string
      multiplier: number
      tokensCost: number
      startedAt: string
      expiresAt: string
      isActive: boolean
    }[]
  > {
    try {
      const now = new Date()

      const rows = await this.db
        .select()
        .from(profileBoosts)
        .where(eq(profileBoosts.userId, userId))
        .orderBy(profileBoosts.startedAt)
        .limit(limit)

      return rows.map((row) => ({
        id: row.id,
        boostType: row.boostType,
        multiplier: row.multiplier,
        tokensCost: row.tokensCost,
        startedAt: row.startedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        isActive: row.expiresAt > now,
      }))
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error fetching boost history for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get available boost types with their pricing.
   */
  getBoostTypes(): {
    type: string
    tokens: number
    durationMinutes: number
    multiplier: number
  }[] {
    return Object.entries(BOOST_TYPES).map(([type, config]) => ({
      type,
      tokens: config.tokens,
      durationMinutes: config.duration / 60,
      multiplier: config.multiplier,
    }))
  }
}
