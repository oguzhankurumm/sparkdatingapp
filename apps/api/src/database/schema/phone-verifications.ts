import { pgTable, uuid, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core'

export const phoneVerifications = pgTable('phone_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: varchar('phone', { length: 20 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type PhoneVerification = typeof phoneVerifications.$inferSelect
export type NewPhoneVerification = typeof phoneVerifications.$inferInsert
