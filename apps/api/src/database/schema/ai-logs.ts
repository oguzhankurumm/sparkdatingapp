import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const aiFeatureEnum = pgEnum('ai_feature', [
  'profile_analysis',
  'messaging_coach',
  'toxicity_check',
  'photo_moderation',
  'compatibility_score',
  'date_plan',
])

export const aiLogs = pgTable('ai_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  feature: aiFeatureEnum('feature').notNull(),
  prompt: text('prompt'),
  response: text('response'),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type AiLog = typeof aiLogs.$inferSelect
export type NewAiLog = typeof aiLogs.$inferInsert
