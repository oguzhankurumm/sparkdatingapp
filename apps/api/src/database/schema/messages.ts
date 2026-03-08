import { pgTable, uuid, text, timestamp, boolean, pgEnum, index } from 'drizzle-orm/pg-core'
import { users } from './users'
import { matches } from './matches'

export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'image',
  'gif',
  'voice',
  'gift',
  'system',
])

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id')
      .notNull()
      .references(() => matches.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: messageTypeEnum('type').default('text').notNull(),
    content: text('content'),
    mediaUrl: text('media_url'),

    // Translation
    translatedContent: text('translated_content'),
    originalLanguage: text('original_language'),

    // Read receipt
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),

    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('messages_match_id_idx').on(table.matchId),
    index('messages_created_at_idx').on(table.createdAt),
  ],
)

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
