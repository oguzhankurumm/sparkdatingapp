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
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const tableStatusEnum = pgEnum('table_status', ['active', 'full', 'completed', 'cancelled'])

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
    venueId: uuid('venue_id').references(() => venues.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    scheduledAt: timestamp('scheduled_at').notNull(),
    maxGuests: integer('max_guests').default(4).notNull(),
    status: tableStatusEnum('status').default('active').notNull(),

    // VIP features
    isVip: boolean('is_vip').default(false).notNull(),
    vipPerks: text('vip_perks'), // JSON string of perks

    // Location (if no venue)
    customLocation: text('custom_location'),
    latitude: varchar('latitude', { length: 30 }),
    longitude: varchar('longitude', { length: 30 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('tables_host_id_idx').on(table.hostId),
    index('tables_status_idx').on(table.status),
  ],
)

export const tableGuests = pgTable('table_guests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableId: uuid('table_id')
    .notNull()
    .references(() => tables.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | accepted | declined
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

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
