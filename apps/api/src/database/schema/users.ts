import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  date,
} from 'drizzle-orm/pg-core'

export const genderEnum = pgEnum('gender', ['male', 'female', 'non_binary'])
export const kycStatusEnum = pgEnum('kyc_status', ['none', 'pending', 'verified'])
export const relationshipGoalEnum = pgEnum('relationship_goal', [
  'long_term',
  'short_term',
  'friends',
  'unsure',
])
export const showMeEnum = pgEnum('show_me', ['men', 'women', 'everyone'])
export const zodiacSignEnum = pgEnum('zodiac_sign', [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  passwordHash: text('password_hash'),

  // Profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  birthday: date('birthday').notNull(),
  zodiacSign: zodiacSignEnum('zodiac_sign'),
  gender: genderEnum('gender').notNull(),
  showGender: boolean('show_gender').default(true).notNull(),
  bio: text('bio'),
  latitude: varchar('latitude', { length: 30 }),
  longitude: varchar('longitude', { length: 30 }),
  city: varchar('city', { length: 200 }),
  country: varchar('country', { length: 100 }),

  // Discovery preferences
  relationshipGoal: relationshipGoalEnum('relationship_goal'),
  showMe: showMeEnum('show_me').default('everyone').notNull(),
  ageRangeMin: integer('age_range_min').default(18).notNull(),
  ageRangeMax: integer('age_range_max').default(50).notNull(),
  maxDistanceKm: integer('max_distance_km').default(50).notNull(),

  // Media
  avatarUrl: text('avatar_url'),
  voiceNoteUrl: varchar('voice_note_url', { length: 500 }),
  voiceNoteDuration: integer('voice_note_duration'), // seconds, max 30
  videoProfileUrl: varchar('video_profile_url', { length: 500 }),
  videoProfileThumbnailUrl: varchar('video_profile_thumbnail_url', { length: 500 }),

  // Interests (stored as JSON array of string IDs)
  interests: text('interests').array(),

  // AI & Translation
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en').notNull(),
  autoTranslate: boolean('auto_translate').default(false).notNull(),

  // Gamification
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: timestamp('last_active_date'),

  // Verification
  isVerified: boolean('is_verified').default(false).notNull(),
  kycStatus: kycStatusEnum('kyc_status').default('none').notNull(),

  // Video Call
  isReadyForCall: boolean('is_ready_for_call').default(false).notNull(),
  callRate: integer('call_rate').default(10).notNull(), // tokens per minute (min 10, max 100)

  // Privacy
  isPhotosPrivate: boolean('is_photos_private').default(false).notNull(),

  // Auth
  googleId: varchar('google_id', { length: 255 }).unique(),
  appleId: varchar('apple_id', { length: 255 }).unique(),

  // Admin
  role: varchar('role', { length: 20 }).default('user').notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
  banReason: text('ban_reason'),

  // GDPR / KVKK Consent
  consentGdprAt: timestamp('consent_gdpr_at'),
  consentKvkkAt: timestamp('consent_kvkk_at'),
  dataExportRequestedAt: timestamp('data_export_requested_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
