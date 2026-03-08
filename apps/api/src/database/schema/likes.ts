import { pgTable, uuid, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const likeTypeEnum = pgEnum('like_type', ['like', 'super_like', 'pass'])

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    receiverId: uuid('receiver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: likeTypeEnum('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('likes_pair_idx').on(table.senderId, table.receiverId)],
)

export type Like = typeof likes.$inferSelect
export type NewLike = typeof likes.$inferInsert
