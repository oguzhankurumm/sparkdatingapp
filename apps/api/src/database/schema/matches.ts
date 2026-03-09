import { pgTable, uuid, timestamp, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const matchStatusEnum = pgEnum('match_status', ['active', 'expired', 'unmatched'])

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user1Id: uuid('user1_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    user2Id: uuid('user2_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: matchStatusEnum('status').default('active').notNull(),

    // 72h expiry system — null expiresAt means permanent (first message sent)
    expiresAt: timestamp('expires_at'),
    firstMessageAt: timestamp('first_message_at'),
    lastMessageAt: timestamp('last_message_at'),
    ghostReminderSentAt: timestamp('ghost_reminder_sent_at'),
    urgentReminderSentAt: timestamp('urgent_reminder_sent_at'),

    matchedAt: timestamp('matched_at').defaultNow().notNull(),
    unmatchedAt: timestamp('unmatched_at'),
  },
  (table) => [
    uniqueIndex('matches_pair_idx').on(table.user1Id, table.user2Id),
    index('matches_expiry_idx').on(table.status, table.expiresAt),
  ],
)

export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
