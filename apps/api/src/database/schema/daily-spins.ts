import { pgTable, uuid, integer, varchar, timestamp, index, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const spinSourceEnum = pgEnum('spin_source', ['free', 'ad'])

export const dailySpins = pgTable(
  'daily_spins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Reward details
    rewardType: varchar('reward_type', { length: 50 }).notNull(),
    rewardAmount: integer('reward_amount').default(0).notNull(),
    rewardLabel: varchar('reward_label', { length: 100 }),

    // How the spin was earned
    source: spinSourceEnum('source').default('free').notNull(),

    // Server-side random seed (anti-cheat audit trail)
    serverSeed: varchar('server_seed', { length: 64 }).notNull(),

    // Ad verification token (null for free spins)
    adVerificationToken: varchar('ad_verification_token', { length: 255 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('daily_spins_user_date_idx').on(table.userId, table.createdAt)],
)

export type DailySpin = typeof dailySpins.$inferSelect
export type NewDailySpin = typeof dailySpins.$inferInsert
