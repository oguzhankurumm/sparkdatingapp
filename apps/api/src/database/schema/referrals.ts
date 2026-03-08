import { pgTable, uuid, varchar, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const referralStatusEnum = pgEnum('referral_status', ['pending', 'completed', 'expired'])

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviterId: uuid('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  inviteeId: uuid('invitee_id').references(() => users.id, { onDelete: 'set null' }),
  referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
  branchLinkId: varchar('branch_link_id', { length: 255 }),
  status: referralStatusEnum('status').default('pending').notNull(),
  inviterBonus: integer('inviter_bonus').default(200).notNull(),
  inviteeBonus: integer('invitee_bonus').default(100).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Referral = typeof referrals.$inferSelect
export type NewReferral = typeof referrals.$inferInsert
