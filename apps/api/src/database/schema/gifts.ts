import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const giftContextEnum = pgEnum('gift_context', ['chat', 'call', 'stream'])

export const giftTypes = pgTable('gift_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  animationUrl: text('animation_url'),
  tokenCost: integer('token_cost').notNull(),
  category: varchar('category', { length: 50 }),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sentGifts = pgTable(
  'sent_gifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    giftTypeId: uuid('gift_type_id')
      .notNull()
      .references(() => giftTypes.id),
    context: giftContextEnum('context').notNull(),
    contextReferenceId: uuid('context_reference_id'), // matchId, callId, or streamId
    tokensCost: integer('tokens_cost').notNull(),
    tokensToReceiver: integer('tokens_to_receiver').notNull(), // 80%
    platformCut: integer('platform_cut').notNull(), // 20%
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('sent_gifts_sender_idx').on(table.senderId),
    index('sent_gifts_receiver_idx').on(table.receiverId),
  ],
)

export type GiftType = typeof giftTypes.$inferSelect
export type NewGiftType = typeof giftTypes.$inferInsert
export type SentGift = typeof sentGifts.$inferSelect
export type NewSentGift = typeof sentGifts.$inferInsert
