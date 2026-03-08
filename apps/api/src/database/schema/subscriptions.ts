import { pgTable, uuid, varchar, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'cancelled',
  'expired',
  'past_due',
  'trialing',
])
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'premium', 'platinum'])
export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly'])

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: subscriptionPlanEnum('plan').default('free').notNull(),
    status: subscriptionStatusEnum('status').default('active').notNull(),
    billingInterval: billingIntervalEnum('billing_interval'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    revenuecatId: varchar('revenuecat_id', { length: 255 }),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('subscriptions_stripe_idx').on(table.stripeSubscriptionId)],
)

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
