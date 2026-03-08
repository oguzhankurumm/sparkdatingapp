import { pgTable, uuid, integer, varchar, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const dailySpins = pgTable(
  'daily_spins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rewardType: varchar('reward_type', { length: 50 }).notNull(), // tokens | boost | super_like | nothing
    rewardAmount: integer('reward_amount').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('daily_spins_user_date_idx').on(table.userId, table.createdAt)],
)

export type DailySpin = typeof dailySpins.$inferSelect
export type NewDailySpin = typeof dailySpins.$inferInsert
