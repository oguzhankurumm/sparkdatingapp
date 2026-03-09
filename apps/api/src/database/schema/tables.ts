import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const tableStatusEnum = pgEnum('table_status', ['active', 'full', 'completed', 'cancelled'])
export const guestStatusEnum = pgEnum('guest_status', ['pending', 'accepted', 'declined'])

export const venues = pgTable('venues', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  latitude: varchar('latitude', { length: 30 }),
  longitude: varchar('longitude', { length: 30 }),
  city: varchar('city', { length: 200 }),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tables = pgTable(
  'tables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hostId: uuid('host_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 100 }).notNull(),
    description: text('description'),

    // Venue — inline fields (OGU-146 spec) + optional FK for structured venues
    venueId: uuid('venue_id').references(() => venues.id),
    venueName: varchar('venue_name', { length: 100 }),
    venueAddress: text('venue_address'),

    scheduledAt: timestamp('scheduled_at').notNull(),
    maxGuests: integer('max_guests').default(1).notNull(),
    status: tableStatusEnum('status').default('active').notNull(),

    // Token costs
    tokenCostToCreate: integer('token_cost_to_create').default(100).notNull(),
    tokenCostToJoin: integer('token_cost_to_join').default(50).notNull(),

    // VIP features
    isVip: boolean('is_vip').default(false).notNull(),
    vipPerks: jsonb('vip_perks').$type<Record<string, unknown>>(),

    // Location (if no venue)
    customLocation: text('custom_location'),
    latitude: varchar('latitude', { length: 30 }),
    longitude: varchar('longitude', { length: 30 }),

    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tables_host_id_idx').on(table.hostId),
    index('tables_status_idx').on(table.status),
    index('tables_scheduled_at_idx').on(table.scheduledAt),
  ],
)

export const tableGuests = pgTable(
  'table_guests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tableId: uuid('table_id')
      .notNull()
      .references(() => tables.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: guestStatusEnum('status').default('pending').notNull(),
    message: text('message'), // optional application message
    tokensCharged: integer('tokens_charged').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    respondedAt: timestamp('responded_at'),
  },
  (guest) => [
    index('table_guests_table_id_idx').on(guest.tableId),
    index('table_guests_user_id_idx').on(guest.userId),
  ],
)

export const tablePerks = pgTable('table_perks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  tokenCost: integer('token_cost').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Venue = typeof venues.$inferSelect
export type NewVenue = typeof venues.$inferInsert
export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
export type TableGuest = typeof tableGuests.$inferSelect
export type NewTableGuest = typeof tableGuests.$inferInsert
export type TablePerk = typeof tablePerks.$inferSelect
export type NewTablePerk = typeof tablePerks.$inferInsert
