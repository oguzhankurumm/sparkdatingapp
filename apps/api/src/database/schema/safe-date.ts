import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const safeDateStatusEnum = pgEnum('safe_date_status', ['active', 'completed', 'emergency'])

export const safeDateSessions = pgTable('safe_date_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }).notNull(),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }).notNull(),
  publicToken: varchar('public_token', { length: 64 }).notNull().unique(),
  venueAddress: text('venue_address'),
  latitude: varchar('latitude', { length: 30 }),
  longitude: varchar('longitude', { length: 30 }),
  status: safeDateStatusEnum('status').default('active').notNull(),
  scheduledEndAt: timestamp('scheduled_end_at').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
})

export type SafeDateSession = typeof safeDateSessions.$inferSelect
export type NewSafeDateSession = typeof safeDateSessions.$inferInsert
