import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const panicEvents = pgTable('panic_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  latitude: varchar('latitude', { length: 30 }),
  longitude: varchar('longitude', { length: 30 }),
  deviceInfo: text('device_info'),
  emergencyContactName: varchar('emergency_contact_name', { length: 200 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
  smsSent: boolean('sms_sent').default(false).notNull(),
  adminAlertSent: boolean('admin_alert_sent').default(false).notNull(),
  resolvedAt: timestamp('resolved_at'),
  autoResetAt: timestamp('auto_reset_at').notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
})

export type PanicEvent = typeof panicEvents.$inferSelect
export type NewPanicEvent = typeof panicEvents.$inferInsert
