import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const profileViews = pgTable('profile_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewerId: uuid('viewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  viewedId: uuid('viewed_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type ProfileView = typeof profileViews.$inferSelect
export type NewProfileView = typeof profileViews.$inferInsert
