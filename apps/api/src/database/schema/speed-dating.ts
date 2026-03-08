import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const speedDatingStatusEnum = pgEnum('speed_dating_status', [
  'scheduled',
  'active',
  'completed',
  'cancelled',
])

export const speedDatingEvents = pgTable('speed_dating_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  status: speedDatingStatusEnum('status').default('scheduled').notNull(),
  maxParticipants: integer('max_participants').default(20).notNull(),
  currentParticipants: integer('current_participants').default(0).notNull(),
  roundDurationSeconds: integer('round_duration_seconds').default(180).notNull(), // 3 min
  totalRounds: integer('total_rounds').default(5).notNull(),
  currentRound: integer('current_round').default(0).notNull(),
  tokenCost: integer('token_cost').default(0).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type SpeedDatingEvent = typeof speedDatingEvents.$inferSelect
export type NewSpeedDatingEvent = typeof speedDatingEvents.$inferInsert
