import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const profileBoosts = pgTable(
  'profile_boosts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    boostType: varchar('boost_type', { length: 20 }).notNull(), // mini | pro | max
    multiplier: integer('multiplier').notNull(),
    tokensCost: integer('tokens_cost').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [
    index('profile_boosts_user_idx').on(table.userId),
    index('profile_boosts_expires_idx').on(table.expiresAt),
  ],
)

export type ProfileBoost = typeof profileBoosts.$inferSelect
export type NewProfileBoost = typeof profileBoosts.$inferInsert
