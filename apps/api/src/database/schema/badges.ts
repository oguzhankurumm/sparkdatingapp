import { pgTable, uuid, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  badgeId: varchar('badge_id', { length: 50 }).notNull(), // e.g. 'streak_7', 'first_match', 'verified'
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  tokenReward: integer('token_reward').default(0).notNull(),
  isDisplayed: boolean('is_displayed').default(true).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
})

export type UserBadge = typeof userBadges.$inferSelect
export type NewUserBadge = typeof userBadges.$inferInsert
