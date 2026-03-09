import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'

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
  tokenCost: integer('token_cost').default(10).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type SpeedDatingEvent = typeof speedDatingEvents.$inferSelect
export type NewSpeedDatingEvent = typeof speedDatingEvents.$inferInsert

// Participants in a speed-dating event
export const speedDatingParticipants = pgTable(
  'speed_dating_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    userId: uuid('user_id').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [index('idx_sdp_event').on(table.eventId), index('idx_sdp_user').on(table.userId)],
)

export type SpeedDatingParticipant = typeof speedDatingParticipants.$inferSelect

// Likes exchanged during speed-dating rounds
export const speedDatingLikes = pgTable(
  'speed_dating_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    fromUserId: uuid('from_user_id').notNull(),
    toUserId: uuid('to_user_id').notNull(),
    round: integer('round').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_sdl_event').on(table.eventId),
    index('idx_sdl_from').on(table.fromUserId),
    index('idx_sdl_to').on(table.toUserId),
  ],
)

export type SpeedDatingLike = typeof speedDatingLikes.$inferSelect
