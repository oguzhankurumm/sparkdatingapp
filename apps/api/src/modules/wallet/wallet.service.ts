import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common'
import { eq, sql, desc, count } from 'drizzle-orm'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import {
  wallets,
  walletTransactions,
  withdrawals,
  coinPackages,
  photoUnlocks,
  users,
  type Wallet,
} from '../../database/schema'
import {
  TOKEN_ECONOMY,
  COIN_PACKAGES,
  type WalletData,
  type WalletTransactionItem,
  type WalletTransactionsResponse,
  type CoinPackageItem,
  type WithdrawResponse,
} from '@spark/types'

const PHOTO_UNLOCK_COST = 100

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name)

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Get or create a wallet for a user.
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    try {
      const [existing] = await this.db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .limit(1)

      if (existing) return existing

      const [created] = await this.db.insert(wallets).values({ userId }).returning()

      if (!created) throw new Error('Failed to create wallet')
      return created
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting/creating wallet for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get the token balance for a user.
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId)
    return wallet.balance
  }

  /**
   * Atomically deduct tokens from a user's wallet and record the transaction.
   * This MUST always run inside a transaction — partial success is unacceptable.
   */
  async deductTokens(
    userId: string,
    amount: number,
    type:
      | 'debit'
      | 'photo_unlock'
      | 'boost_purchase'
      | 'call_charge'
      | 'gift_sent'
      | 'rematch_purchase'
      | 'table_create'
      | 'table_join',
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        // 1. Get wallet with lock-like semantics (select inside tx)
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)

        if (!wallet) {
          throw new BadRequestException('Wallet not found')
        }

        if (wallet.balance < amount) {
          throw new BadRequestException('Insufficient token balance')
        }

        const newBalance = wallet.balance - amount

        // 2. Deduct balance atomically
        await tx
          .update(wallets)
          .set({
            balance: sql`balance - ${amount}`,
            totalSpent: sql`total_spent + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))

        // 3. Record the transaction
        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          type,
          amount: -amount,
          balanceAfter: newBalance,
          description,
          referenceId: referenceId ?? null,
          referenceType: referenceType ?? null,
        })
      })
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error deducting ${amount} tokens for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Credit tokens to a user's wallet (signup bonus, gift received, etc.)
   */
  async creditTokens(
    userId: string,
    amount: number,
    type:
      | 'credit'
      | 'signup_bonus'
      | 'referral_bonus'
      | 'gift_received'
      | 'daily_spin'
      | 'subscription_bonus'
      | 'admin_adjustment'
      | 'call_earning',
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        const wallet = await this.ensureWallet(tx, userId)

        const newBalance = wallet.balance + amount

        await tx
          .update(wallets)
          .set({
            balance: sql`balance + ${amount}`,
            totalEarned: sql`total_earned + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))

        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          type,
          amount,
          balanceAfter: newBalance,
          description,
          referenceId: referenceId ?? null,
          referenceType: referenceType ?? null,
        })
      })
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error crediting ${amount} tokens for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Unlock a target user's photos. Returns true if already unlocked.
   * Deducts PHOTO_UNLOCK_COST tokens atomically.
   */
  async unlockPhotos(
    viewerId: string,
    targetUserId: string,
  ): Promise<{ alreadyUnlocked: boolean }> {
    try {
      // Check if already unlocked
      const [existing] = await this.db
        .select()
        .from(photoUnlocks)
        .where(
          sql`${photoUnlocks.viewerId} = ${viewerId} AND ${photoUnlocks.targetUserId} = ${targetUserId}`,
        )
        .limit(1)

      if (existing) {
        return { alreadyUnlocked: true }
      }

      // Deduct tokens + insert unlock record atomically
      await this.db.transaction(async (tx) => {
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, viewerId))
          .limit(1)

        if (!wallet) {
          throw new BadRequestException('Wallet not found. Earn or purchase tokens first.')
        }

        if (wallet.balance < PHOTO_UNLOCK_COST) {
          throw new BadRequestException(
            `Not enough tokens. Need ${PHOTO_UNLOCK_COST}, have ${wallet.balance}.`,
          )
        }

        const newBalance = wallet.balance - PHOTO_UNLOCK_COST

        // Deduct tokens
        await tx
          .update(wallets)
          .set({
            balance: sql`balance - ${PHOTO_UNLOCK_COST}`,
            totalSpent: sql`total_spent + ${PHOTO_UNLOCK_COST}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, wallet.id))

        // Record wallet transaction
        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          type: 'photo_unlock',
          amount: -PHOTO_UNLOCK_COST,
          balanceAfter: newBalance,
          description: `Unlocked photos for user`,
          referenceType: 'photo_unlock',
        })

        // Record the unlock
        await tx.insert(photoUnlocks).values({
          viewerId,
          targetUserId,
          tokensCost: PHOTO_UNLOCK_COST,
        })
      })

      return { alreadyUnlocked: false }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error unlocking photos: viewer=${viewerId}, target=${targetUserId}`, error)
      throw error
    }
  }

  /**
   * Check if a viewer has unlocked a target user's photos.
   */
  async hasUnlockedPhotos(viewerId: string, targetUserId: string): Promise<boolean> {
    const [existing] = await this.db
      .select()
      .from(photoUnlocks)
      .where(
        sql`${photoUnlocks.viewerId} = ${viewerId} AND ${photoUnlocks.targetUserId} = ${targetUserId}`,
      )
      .limit(1)

    return !!existing
  }

  // ── New wallet data methods ──────────────────────────────────

  /**
   * Full wallet overview for GET /wallet/me.
   * Computes withdrawable balance from totalEarned - totalWithdrawn.
   */
  async getWalletData(userId: string): Promise<WalletData> {
    try {
      const wallet = await this.getOrCreateWallet(userId)

      // Sum pending withdrawals
      const [pendingResult] = await this.db
        .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
        .from(withdrawals)
        .where(
          sql`${withdrawals.userId} = ${userId} AND ${withdrawals.status} IN ('pending', 'processing')`,
        )

      const pendingWithdrawal = Number(pendingResult?.total ?? 0)
      const withdrawableBalance = Math.max(
        0,
        wallet.totalEarned - wallet.totalWithdrawn - pendingWithdrawal,
      )

      return {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
        totalWithdrawn: wallet.totalWithdrawn,
        withdrawableBalance,
        pendingWithdrawal,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting wallet data for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Paginated transaction history for GET /wallet/transactions.
   */
  async getTransactions(
    userId: string,
    page: number,
    limit: number,
  ): Promise<WalletTransactionsResponse> {
    try {
      const wallet = await this.getOrCreateWallet(userId)
      const offset = (page - 1) * limit

      const [rows, totalResult] = await Promise.all([
        this.db
          .select({
            id: walletTransactions.id,
            type: walletTransactions.type,
            amount: walletTransactions.amount,
            balanceAfter: walletTransactions.balanceAfter,
            description: walletTransactions.description,
            createdAt: walletTransactions.createdAt,
          })
          .from(walletTransactions)
          .where(eq(walletTransactions.walletId, wallet.id))
          .orderBy(desc(walletTransactions.createdAt))
          .limit(limit)
          .offset(offset),
        this.db
          .select({ total: count() })
          .from(walletTransactions)
          .where(eq(walletTransactions.walletId, wallet.id)),
      ])

      const transactions: WalletTransactionItem[] = rows.map((row) => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        balanceAfter: row.balanceAfter,
        description: row.description,
        createdAt: row.createdAt.toISOString(),
      }))

      return {
        transactions,
        total: Number(totalResult[0]?.total ?? 0),
        page,
        limit,
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Error getting transactions for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Get available coin packages. Reads from DB if seeded, falls back to COIN_PACKAGES constant.
   */
  async getCoinPackages(): Promise<CoinPackageItem[]> {
    try {
      const dbPackages = await this.db
        .select()
        .from(coinPackages)
        .where(sql`${coinPackages.isActive} = 'true'`)
        .orderBy(coinPackages.sortOrder)

      if (dbPackages.length > 0) {
        return dbPackages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          tokens: pkg.tokens,
          priceUsd: pkg.priceUsd,
          bonusTokens: pkg.bonusTokens,
        }))
      }

      return COIN_PACKAGES
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error getting coin packages', error)
      return COIN_PACKAGES
    }
  }

  /**
   * Initiate a token purchase via Stripe Checkout.
   * Returns a checkout URL for the client to redirect to.
   */
  async initiatePurchase(userId: string, packageId: string): Promise<{ checkoutUrl: string }> {
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) {
      throw new BadRequestException(`Invalid package: ${packageId}`)
    }

    // TODO: Create Stripe Checkout Session when Stripe is integrated
    // For now, return a placeholder — the actual Stripe integration will
    // create a checkout session with the correct price and redirect URL.
    // After successful payment, a webhook will credit tokens to the user's wallet.
    this.logger.log(
      `Purchase initiated: user=${userId}, package=${packageId}, price=$${pkg.priceUsd / 100}`,
    )

    return {
      checkoutUrl: `/wallet/purchase/pending?package=${packageId}`,
    }
  }

  /**
   * Request a withdrawal from earned balance.
   * Validates minimum amount, account age, and available withdrawable balance.
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
    method: string,
  ): Promise<WithdrawResponse> {
    try {
      if (amount < TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS) {
        throw new BadRequestException(
          `Minimum withdrawal is ${TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS} tokens`,
        )
      }

      // KYC enforcement: large withdrawals require verified identity
      if (amount >= TOKEN_ECONOMY.KYC_REQUIRED_THRESHOLD) {
        const [user] = await this.db
          .select({ kycStatus: users.kycStatus })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (user?.kycStatus !== 'verified') {
          throw new BadRequestException(
            `Withdrawals of ${TOKEN_ECONOMY.KYC_REQUIRED_THRESHOLD}+ tokens require KYC verification. Please complete identity verification first.`,
          )
        }
      }

      const validMethods = ['stripe', 'bank', 'paypal', 'usdt_trc20', 'usdc_erc20']
      if (!validMethods.includes(method)) {
        throw new BadRequestException(`Invalid withdrawal method: ${method}`)
      }

      return await this.db.transaction(async (tx) => {
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)

        if (!wallet) {
          throw new BadRequestException('Wallet not found')
        }

        // Compute withdrawable: totalEarned - totalWithdrawn - pending
        const [pendingResult] = await tx
          .select({ total: sql<number>`coalesce(sum(${withdrawals.amount}), 0)` })
          .from(withdrawals)
          .where(
            sql`${withdrawals.userId} = ${userId} AND ${withdrawals.status} IN ('pending', 'processing')`,
          )

        const pendingAmount = Number(pendingResult?.total ?? 0)
        const withdrawable = wallet.totalEarned - wallet.totalWithdrawn - pendingAmount

        if (amount > withdrawable) {
          throw new BadRequestException(
            `Insufficient withdrawable balance. Available: ${withdrawable} tokens`,
          )
        }

        if (amount > wallet.balance) {
          throw new BadRequestException('Insufficient total balance')
        }

        // Create withdrawal record
        const [withdrawal] = await tx
          .insert(withdrawals)
          .values({
            userId,
            walletId: wallet.id,
            amount,
            status: 'pending',
          })
          .returning()

        if (!withdrawal) throw new Error('Failed to create withdrawal')

        return {
          withdrawalId: withdrawal.id,
          amount: withdrawal.amount,
          status: 'pending' as const,
        }
      })
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      Sentry.captureException(error)
      this.logger.error(`Error requesting withdrawal for user: ${userId}`, error)
      throw error
    }
  }

  /**
   * Ensure a wallet exists within a transaction context.
   */
  private async ensureWallet(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0],
    userId: string,
  ): Promise<Wallet> {
    const [existing] = await tx.select().from(wallets).where(eq(wallets.userId, userId)).limit(1)

    if (existing) return existing

    const [created] = await tx.insert(wallets).values({ userId }).returning()

    if (!created) throw new Error('Failed to create wallet')
    return created
  }
}
