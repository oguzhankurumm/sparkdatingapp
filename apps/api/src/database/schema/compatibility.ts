import { pgTable, uuid, integer, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const compatibilityScores = pgTable(
  'compatibility_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userAId: uuid('user_a_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userBId: uuid('user_b_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(), // 0-100
    breakdown: jsonb('breakdown'), // { interests: 80, goals: 90, zodiac: 70, ... }
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('compatibility_pair_idx').on(table.userAId, table.userBId),
    index('compatibility_user_a_idx').on(table.userAId),
    index('compatibility_user_b_idx').on(table.userBId),
  ],
)

export type CompatibilityScore = typeof compatibilityScores.$inferSelect
export type NewCompatibilityScore = typeof compatibilityScores.$inferInsert
