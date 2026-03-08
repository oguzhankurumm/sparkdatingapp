import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'dismissed'])
export const reportReasonEnum = pgEnum('report_reason', [
  'spam',
  'harassment',
  'fake_profile',
  'inappropriate_content',
  'underage',
  'scam',
  'other',
])

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reportedId: uuid('reported_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  reason: reportReasonEnum('reason').notNull(),
  details: text('details'),
  status: reportStatusEnum('status').default('pending').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNote: text('review_note'),
  screenshotUrl: varchar('screenshot_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
})

export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
