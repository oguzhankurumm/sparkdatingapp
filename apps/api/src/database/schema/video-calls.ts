import { pgTable, uuid, integer, timestamp, pgEnum, varchar } from 'drizzle-orm/pg-core'
import { users } from './users'

export const callStatusEnum = pgEnum('call_status', [
  'ringing',
  'active',
  'completed',
  'missed',
  'declined',
])

export const callTypeEnum = pgEnum('call_type', ['video', 'audio'])

export const videoCalls = pgTable('video_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  callerId: uuid('caller_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: callStatusEnum('status').default('ringing').notNull(),
  callType: callTypeEnum('call_type').default('video').notNull(),
  livekitRoom: varchar('livekit_room', { length: 255 }),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  totalTokensCharged: integer('total_tokens_charged').default(0).notNull(),
  tokenRatePerMinute: integer('token_rate_per_minute').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const videoCallTicks = pgTable('video_call_ticks', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id')
    .notNull()
    .references(() => videoCalls.id, { onDelete: 'cascade' }),
  minute: integer('minute').notNull(),
  tokensCharged: integer('tokens_charged').notNull(),
  chargedAt: timestamp('charged_at').defaultNow().notNull(),
})

export type VideoCall = typeof videoCalls.$inferSelect
export type NewVideoCall = typeof videoCalls.$inferInsert
export type VideoCallTick = typeof videoCallTicks.$inferSelect
export type NewVideoCallTick = typeof videoCallTicks.$inferInsert
