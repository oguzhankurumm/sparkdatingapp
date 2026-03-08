import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const dataExportStatusEnum = pgEnum('data_export_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const dataExportRequests = pgTable('data_export_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: dataExportStatusEnum('status').default('pending').notNull(),
  s3Key: varchar('s3_key', { length: 500 }),
  downloadUrl: text('download_url'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type DataExportRequest = typeof dataExportRequests.$inferSelect
export type NewDataExportRequest = typeof dataExportRequests.$inferInsert
