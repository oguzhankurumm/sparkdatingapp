/** Subscription plan types — prices in CLAUDE.md */
export type SubscriptionPlan = 'free' | 'premium' | 'platinum'

/** Gift sending context — each context has same platform cut (20%) */
export type GiftContext = 'chat' | 'call' | 'stream'

/** Boost types with token cost, duration (seconds), and profile visibility multiplier */
export interface BoostType {
  tokens: number
  duration: number
  multiplier: number
}

export const BOOST_TYPES = {
  mini: { tokens: 500, duration: 30 * 60, multiplier: 10 },
  pro: { tokens: 1500, duration: 6 * 60 * 60, multiplier: 5 },
  max: { tokens: 3000, duration: 24 * 60 * 60, multiplier: 3 },
} as const satisfies Record<string, BoostType>

/** Gender type matching the database enum */
export type Gender = 'male' | 'female' | 'non_binary'

/** Plan features resolved per-user (gender + subscription aware) */
export interface PlanFeatures {
  dailyLikes: number // Infinity = unlimited
  superLikesPerDay: number
  canSeeWhoLiked: boolean
  whoLikedDailyLimit: number // 0 = none, Infinity = unlimited
  canRewind: boolean
  boostsPerMonth: number
  advancedFilters: boolean
  readReceipts: boolean
  incognitoMode: boolean
  canSeeProfileViewers: boolean
}

/** Feature configs by plan */
export const FREE_MALE_FEATURES: PlanFeatures = {
  dailyLikes: 20,
  superLikesPerDay: 1,
  canSeeWhoLiked: false,
  whoLikedDailyLimit: 0,
  canRewind: false,
  boostsPerMonth: 0,
  advancedFilters: false,
  readReceipts: false,
  incognitoMode: false,
  canSeeProfileViewers: false,
}

export const FREE_FEMALE_FEATURES: PlanFeatures = {
  dailyLikes: Infinity,
  superLikesPerDay: 3,
  canSeeWhoLiked: true,
  whoLikedDailyLimit: 5,
  canRewind: true,
  boostsPerMonth: 4, // ~1/week
  advancedFilters: true,
  readReceipts: true,
  incognitoMode: false,
  canSeeProfileViewers: false,
}

export const PREMIUM_FEATURES: PlanFeatures = {
  dailyLikes: Infinity,
  superLikesPerDay: 5,
  canSeeWhoLiked: true,
  whoLikedDailyLimit: Infinity,
  canRewind: true,
  boostsPerMonth: 5,
  advancedFilters: true,
  readReceipts: true,
  incognitoMode: false,
  canSeeProfileViewers: true,
}

export const PLATINUM_FEATURES: PlanFeatures = {
  dailyLikes: Infinity,
  superLikesPerDay: 5,
  canSeeWhoLiked: true,
  whoLikedDailyLimit: Infinity,
  canRewind: true,
  boostsPerMonth: 5,
  advancedFilters: true,
  readReceipts: true,
  incognitoMode: true,
  canSeeProfileViewers: true,
}

/** Discovery scoring weights */
export const DISCOVERY_WEIGHTS = {
  genderPriority: 0.25,
  interests: 0.35,
  distance: 0.2,
  recency: 0.2,
} as const

/** Table limits per subscription plan */
export const TABLE_LIMITS = {
  free: { maxActiveTables: 1 },
  premium: { maxActiveTables: 3 },
  platinum: { maxActiveTables: 3 },
} as const satisfies Record<SubscriptionPlan, { maxActiveTables: number }>

/** Token economy constants */
export const TOKEN_ECONOMY = {
  USD_TO_TOKENS: 100,
  PLATFORM_CUT_PERCENT: 20,
  CREATOR_CUT_PERCENT: 80,
  SIGNUP_BONUS: 1000,
  REFERRAL_BONUS_INVITER: 200,
  REFERRAL_BONUS_INVITEE: 100,
  MIN_WITHDRAWAL_TOKENS: 5000,
  KYC_REQUIRED_THRESHOLD: 50_000,
  MIN_ACCOUNT_AGE_DAYS: 30,
  MATCH_EXPIRY_HOURS: 72,
  MATCH_REMINDER_HOURS: 48,
  REMATCH_COST: 50,
} as const
