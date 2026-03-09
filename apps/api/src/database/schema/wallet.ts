import { pgTable, uuid, integer, timestamp, pgEnum, text, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const transactionTypeEnum = pgEnum('transaction_type', [
  'credit',
  'debit',
  'signup_bonus',
  'referral_bonus',
  'gift_received',
  'gift_sent',
  'boost_purchase',
  'call_charge',
  'daily_spin',
  'withdrawal',
  'subscription_bonus',
  'rematch_purchase',
  'admin_adjustment',
  'photo_unlock',
  'table_create',
  'table_join',
  'call_earning',
  'streak_bonus',
  'badge_reward',
  'bundle_bonus',
  'speed_dating_join',
])

export const withdrawalStatusEnum = pgEnum('withdrawal_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
])

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: integer('balance').default(0).notNull(),
  totalEarned: integer('total_earned').default(0).notNull(),
  totalSpent: integer('total_spent').default(0).notNull(),
  totalWithdrawn: integer('total_withdrawn').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description'),
  referenceId: uuid('reference_id'), // links to gift, call, boost, etc.
  referenceType: varchar('reference_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const coinPackages = pgTable('coin_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  tokens: integer('tokens').notNull(),
  priceUsd: integer('price_usd').notNull(), // in cents
  bonusTokens: integer('bonus_tokens').default(0).notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  isActive: varchar('is_active', { length: 5 }).default('true').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id),
  amount: integer('amount').notNull(),
  status: withdrawalStatusEnum('status').default('pending').notNull(),
  stripePayoutId: varchar('stripe_payout_id', { length: 255 }),
  failureReason: text('failure_reason'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
})

export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
export type WalletTransaction = typeof walletTransactions.$inferSelect
export type NewWalletTransaction = typeof walletTransactions.$inferInsert
export type CoinPackage = typeof coinPackages.$inferSelect
export type NewCoinPackage = typeof coinPackages.$inferInsert
export type Withdrawal = typeof withdrawals.$inferSelect
export type NewWithdrawal = typeof withdrawals.$inferInsert
