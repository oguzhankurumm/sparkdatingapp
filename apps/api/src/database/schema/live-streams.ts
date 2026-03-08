import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const streamStatusEnum = pgEnum('stream_status', ['live', 'ended', 'banned'])

export const liveStreams = pgTable(
  'live_streams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hostId: uuid('host_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }),
    status: streamStatusEnum('status').default('live').notNull(),
    livekitRoom: varchar('livekit_room', { length: 255 }),
    thumbnailUrl: text('thumbnail_url'),
    viewerCount: integer('viewer_count').default(0).notNull(),
    peakViewerCount: integer('peak_viewer_count').default(0).notNull(),
    totalGiftsReceived: integer('total_gifts_received').default(0).notNull(),
    isVip: boolean('is_vip').default(false).notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
  },
  (table) => [
    index('live_streams_host_idx').on(table.hostId),
    index('live_streams_status_idx').on(table.status),
  ],
)

export const streamViewers = pgTable('stream_viewers', {
  id: uuid('id').primaryKey().defaultRandom(),
  streamId: uuid('stream_id')
    .notNull()
    .references(() => liveStreams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
})

export type LiveStream = typeof liveStreams.$inferSelect
export type NewLiveStream = typeof liveStreams.$inferInsert
export type StreamViewer = typeof streamViewers.$inferSelect
export type NewStreamViewer = typeof streamViewers.$inferInsert
