import { pgTable, uuid, varchar, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { users } from './users'

export const panicEvents = pgTable(
  'panic_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Location at trigger time
    latitude: varchar('latitude', { length: 30 }),
    longitude: varchar('longitude', { length: 30 }),

    // Device context
    deviceInfo: jsonb('device_info'),

    // Emergency contact notified
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
    smsSent: boolean('sms_sent').default(false).notNull(),

    // Admin alert
    adminAlertSent: boolean('admin_alert_sent').default(false).notNull(),

    // Resolution
    resolvedAt: timestamp('resolved_at'),
    autoResetAt: timestamp('auto_reset_at'), // triggeredAt + 24h

    // Timestamps
    triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  },
  (table) => [
    index('panic_events_user_idx').on(table.userId),
    index('panic_events_triggered_idx').on(table.triggeredAt),
    index('panic_events_unresolved_idx').on(table.userId, table.resolvedAt),
  ],
)

export type PanicEvent = typeof panicEvents.$inferSelect
export type NewPanicEvent = typeof panicEvents.$inferInsert
