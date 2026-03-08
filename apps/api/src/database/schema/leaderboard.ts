import { pgTable, uuid, integer, timestamp, varchar, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const leaderboardSnapshots = pgTable(
  'leaderboard_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(), // gifters | streamers | matchers
    rank: integer('rank').notNull(),
    score: integer('score').notNull(),
    weekStart: timestamp('week_start').notNull(), // Monday 00:00
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('leaderboard_week_category_idx').on(table.weekStart, table.category)],
)

export type LeaderboardSnapshot = typeof leaderboardSnapshots.$inferSelect
export type NewLeaderboardSnapshot = typeof leaderboardSnapshots.$inferInsert
