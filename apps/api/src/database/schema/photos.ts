import { pgTable, uuid, varchar, integer, timestamp, real, text, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const moderationStatusEnum = pgEnum('moderation_status', ['pending', 'approved', 'rejected'])

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  position: integer('position').notNull(),

  // Moderation (M6)
  moderationStatus: moderationStatusEnum('moderation_status').default('pending').notNull(),
  moderationScore: real('moderation_score'),
  moderationCategories: text('moderation_categories'),
  moderatedAt: timestamp('moderated_at'),

  // Metadata
  width: integer('width'),
  height: integer('height'),
  blurhash: varchar('blurhash', { length: 100 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
