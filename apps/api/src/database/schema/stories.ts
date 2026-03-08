import { pgTable, uuid, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const storyMediaTypeEnum = pgEnum('story_media_type', ['image', 'video'])

export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mediaUrl: text('media_url').notNull(),
    mediaType: storyMediaTypeEnum('media_type').notNull(),
    caption: text('caption'),
    expiresAt: timestamp('expires_at').notNull(), // 24h from creation
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('stories_user_idx').on(table.userId),
    index('stories_expires_idx').on(table.expiresAt),
  ],
)

export const storyViews = pgTable('story_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id')
    .notNull()
    .references(() => stories.id, { onDelete: 'cascade' }),
  viewerId: uuid('viewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
})

export type Story = typeof stories.$inferSelect
export type NewStory = typeof stories.$inferInsert
export type StoryView = typeof storyViews.$inferSelect
export type NewStoryView = typeof storyViews.$inferInsert
