import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const photoUnlocks = pgTable('photo_unlocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewerId: uuid('viewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetUserId: uuid('target_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokensCost: integer('tokens_cost').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type PhotoUnlock = typeof photoUnlocks.$inferSelect
export type NewPhotoUnlock = typeof photoUnlocks.$inferInsert
