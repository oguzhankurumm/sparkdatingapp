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

/** Billing interval for subscriptions */
export type BillingInterval = 'monthly' | 'yearly'

/** Plan hierarchy for guard comparisons (higher = more access) */
export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  premium: 1,
  platinum: 2,
}

/** Stripe price IDs — configured in Stripe Dashboard */
export const STRIPE_PRICE_IDS = {
  premium_monthly: 'price_premium_monthly',
  premium_yearly: 'price_premium_yearly',
  platinum_monthly: 'price_platinum_monthly',
  platinum_yearly: 'price_platinum_yearly',
} as const

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
  autoTranslate: boolean
  datingHelper: boolean
  priorityDiscovery: boolean
  monthlyBonusTokens: number
  platinumBadge: boolean
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
  autoTranslate: false,
  datingHelper: false,
  priorityDiscovery: false,
  monthlyBonusTokens: 0,
  platinumBadge: false,
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
  autoTranslate: false,
  datingHelper: false,
  priorityDiscovery: false,
  monthlyBonusTokens: 0,
  platinumBadge: false,
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
  autoTranslate: true,
  datingHelper: false,
  priorityDiscovery: false,
  monthlyBonusTokens: 0,
  platinumBadge: false,
}

export const PLATINUM_FEATURES: PlanFeatures = {
  dailyLikes: Infinity,
  superLikesPerDay: 10,
  canSeeWhoLiked: true,
  whoLikedDailyLimit: Infinity,
  canRewind: true,
  boostsPerMonth: 10,
  advancedFilters: true,
  readReceipts: true,
  incognitoMode: true,
  canSeeProfileViewers: true,
  autoTranslate: true,
  datingHelper: true,
  priorityDiscovery: true,
  monthlyBonusTokens: 1000,
  platinumBadge: true,
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

/** Table status values */
export type TableStatus = 'active' | 'full' | 'completed' | 'cancelled' | 'expired'

/** Table guest application status */
export type TableGuestStatus = 'pending' | 'accepted' | 'declined'

/** Table listing — shape returned by API */
export interface TableListing {
  id: string
  title: string
  description: string | null
  venueName: string | null
  venueAddress: string | null
  customLocation: string | null
  scheduledAt: string
  maxGuests: number
  status: TableStatus
  isVip: boolean
  tokenCostToJoin: number
  createdAt: string
  hostFirstName: string | null
  hostAvatarUrl: string | null
  hostIsVerified: boolean
}

/** Table detail with guests — shape returned by GET /tables/:id */
export interface TableDetail extends TableListing {
  hostId: string
  latitude: string | null
  longitude: string | null
  guests: TableGuestInfo[]
}

/** Guest info attached to a table */
export interface TableGuestInfo {
  id: string
  userId: string
  status: TableGuestStatus
  message: string | null
  createdAt: string
  firstName: string | null
  avatarUrl: string | null
  isVerified: boolean
}

/** My table — includes guest/pending counts */
export interface MyTable {
  id: string
  title: string
  description: string | null
  venueName: string | null
  scheduledAt: string
  maxGuests: number
  status: TableStatus
  isVip: boolean
  createdAt: string
  guestCount: number
  pendingCount: number
}

/** Video call status */
export type CallStatus = 'ringing' | 'active' | 'completed' | 'missed' | 'declined'

/** Video call rate limits */
export const CALL_RATE = {
  MIN: 10,
  MAX: 100,
  DEFAULT: 10,
} as const

/** Call history item — shape returned by GET /video-calls/history */
export interface CallHistoryItem {
  id: string
  partnerId: string
  partnerFirstName: string
  partnerAvatarUrl: string | null
  direction: 'outgoing' | 'incoming'
  status: string
  durationSeconds: number
  totalTokensCharged: number
  tokenRatePerMinute: number
  createdAt: string
}

/** Ready-for-call user — shape returned by GET /video-calls/ready-users */
export interface ReadyForCallUser {
  id: string
  firstName: string
  avatarUrl: string | null
  isVerified: boolean
  callRate: number
}

/** Initiate call response — shape returned by POST /video-calls/initiate */
export interface InitiateCallResponse {
  callId: string
  livekitRoom: string
  tokenRatePerMinute: number
  isDirectCall: boolean
}

/** Accept call response — shape returned by PATCH /video-calls/:id/accept */
export interface AcceptCallResponse {
  livekitRoom: string
  tokenRatePerMinute: number
}

/** End call response — shape returned by PATCH /video-calls/:id/end */
export interface EndCallResponse {
  durationSeconds: number
  totalTokensCharged: number
}

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
  TABLE_CREATE_COST: 100,
  TABLE_JOIN_COST: 50,
  VIP_TABLE_CREATE_COST: 500,
  VIP_TABLE_JOIN_COST: 100,
  TABLE_MAX_GUESTS_NORMAL: 5,
  TABLE_MAX_GUESTS_VIP: 10,
  VOICE_NOTE_MAX_DURATION_SECONDS: 30,
  VOICE_NOTE_MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
} as const

// ── Wallet & Earnings ──────────────────────────────────────

/** Wallet overview — shape returned by GET /wallet/me */
export interface WalletData {
  balance: number
  totalEarned: number
  totalSpent: number
  totalWithdrawn: number
  withdrawableBalance: number
  pendingWithdrawal: number
}

/** Transaction item — shape returned by GET /wallet/transactions */
export interface WalletTransactionItem {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  createdAt: string
}

/** Paginated transaction response */
export interface WalletTransactionsResponse {
  transactions: WalletTransactionItem[]
  total: number
  page: number
  limit: number
}

/** Coin package display item */
export interface CoinPackageItem {
  id: string
  name: string
  tokens: number
  priceUsd: number // in cents
  bonusTokens: number
  popular?: boolean
}

/** Withdrawal method */
export type WithdrawalMethod = 'stripe' | 'bank' | 'paypal' | 'usdt_trc20' | 'usdc_erc20'

/** Withdrawal status */
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/** Purchase initiation response */
export interface PurchaseResponse {
  checkoutUrl: string
}

/** Withdrawal request response */
export interface WithdrawResponse {
  withdrawalId: string
  amount: number
  status: WithdrawalStatus
}

/** Coin packages — 6 tiers per spec (priceUsd in cents) */
export const COIN_PACKAGES: CoinPackageItem[] = [
  { id: 'starter', name: 'Starter', tokens: 100, priceUsd: 100, bonusTokens: 0 },
  { id: 'small', name: 'Small', tokens: 500, priceUsd: 500, bonusTokens: 0 },
  { id: 'medium', name: 'Medium', tokens: 1200, priceUsd: 1000, bonusTokens: 200 },
  { id: 'popular', name: 'Popular', tokens: 2800, priceUsd: 2000, bonusTokens: 800, popular: true },
  { id: 'large', name: 'Large', tokens: 6000, priceUsd: 4000, bonusTokens: 2000 },
  { id: 'mega', name: 'Mega', tokens: 15000, priceUsd: 8999, bonusTokens: 5000 },
]

// ── Gifts ──────────────────────────────────────────────

/** Gift type item — shape returned by GET /gifts/types */
export interface GiftTypeItem {
  id: string
  name: string
  description: string | null
  imageUrl: string
  animationUrl: string | null
  tokenCost: number
  category: string | null
  sortOrder: number
}

/** Send gift request body — POST /gifts/send */
export interface SendGiftRequest {
  recipientId: string
  giftTypeId: string
  context: GiftContext
  contextReferenceId?: string
}

/** Send gift response — POST /gifts/send */
export interface SendGiftResponse {
  success: boolean
  newBalance: number
  giftId: string
  tokensCharged: number
}

/** Gift history item — shape returned by GET /gifts/history */
export interface GiftHistoryItem {
  id: string
  giftName: string
  giftImageUrl: string
  tokensCost: number
  tokensToReceiver: number
  context: GiftContext
  createdAt: string
  /** Populated for sent gifts */
  recipientId: string | null
  recipientFirstName: string | null
  recipientAvatarUrl: string | null
  /** Populated for received gifts */
  senderId: string | null
  senderFirstName: string | null
  senderAvatarUrl: string | null
}

/** Paginated gift history response */
export interface GiftHistoryResponse {
  gifts: GiftHistoryItem[]
  total: number
  page: number
  limit: number
}

// ── Subscriptions ──────────────────────────────────────

/** Checkout session response — client redirects to checkoutUrl */
export interface SubscriptionCheckoutResponse {
  checkoutUrl: string
}

/** Customer portal response — client redirects to portalUrl */
export interface SubscriptionPortalResponse {
  portalUrl: string
}

/** Current subscription status — shape returned by GET /subscriptions/me */
export interface SubscriptionMeResponse {
  plan: SubscriptionPlan
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing' | 'none'
  billingInterval: BillingInterval | null
  currentPeriodEnd: string | null
  cancelledAt: string | null
  features: PlanFeatures
}

// ── AI Suite ──────────────────────────────────────────────

/** Toxicity check result — returned by ModerationService.checkToxicity() */
export interface ToxicityCheckResult {
  isToxic: boolean
  score: number
  categories: string[]
  reason: string | null
}

/** Photo moderation result — returned by ModerationService.moderatePhoto() */
export interface PhotoModerationResult {
  status: 'approved' | 'rejected'
  score: number
  categories: string[]
  reason: string | null
}

/** Profile analysis result — returned by GET /ai/profile-analysis */
export interface ProfileAnalysisResult {
  overallScore: number
  photoScore: number
  bioScore: number
  promptsScore: number
  suggestions: ProfileSuggestion[]
}

/** Individual suggestion in profile analysis */
export interface ProfileSuggestion {
  area: 'photo' | 'bio' | 'prompts' | 'interests' | 'general'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
}

/** Messaging coach response — returned by POST /ai/messaging-coach */
export interface MessagingCoachResponse {
  suggestions: string[]
  context: string
}

/** AI feature rate limits */
export const AI_RATE_LIMITS = {
  PROFILE_ANALYSIS_PER_DAY: 3,
  MESSAGING_COACH_PER_DAY: 50,
  MESSAGING_COACH_DEBOUNCE_MS: 800,
} as const

// ── KYC ──────────────────────────────────────────────

/** KYC status values */
export type KycStatus = 'none' | 'pending' | 'verified'

/** Response from POST /kyc/initiate */
export interface KycInitiateResponse {
  applicantId: string
  sdkToken: string
}

/** Response from GET /kyc/status */
export interface KycStatusResponse {
  status: KycStatus
}

// ── Live Stream ──────────────────────────────────────────────

/** Stream status values */
export type StreamStatus = 'live' | 'ended' | 'banned'

/** Stream category options */
export type StreamCategory = 'chat' | 'music' | 'gaming' | 'lifestyle' | 'dating' | 'other'

/** Stream listing — shape returned by GET /streams/active */
export interface StreamListing {
  id: string
  hostId: string
  hostFirstName: string
  hostAvatarUrl: string | null
  hostIsVerified: boolean
  title: string | null
  category: StreamCategory | null
  viewerCount: number
  startedAt: string
}

/** Stream detail — shape returned by GET /streams/:id */
export interface StreamDetail extends StreamListing {
  livekitRoom: string
  peakViewerCount: number
  totalGiftsReceived: number
  totalTokensEarned: number
  status: StreamStatus
}

/** Start stream response — POST /streams/start */
export interface StartStreamResponse {
  streamId: string
  livekitRoom: string
}

/** End stream response — POST /streams/:id/end */
export interface EndStreamResponse {
  durationSeconds: number
  peakViewerCount: number
  totalGiftsReceived: number
  totalTokensEarned: number
}

/** Join stream response — POST /streams/:id/join */
export interface JoinStreamResponse {
  livekitRoom: string
  viewerCount: number
}

// ── Stories ──────────────────────────────────────────────

/** Story media type */
export type StoryMediaType = 'image' | 'video'

/** Single story item — shape returned by story endpoints */
export interface StoryItem {
  id: string
  userId: string
  mediaUrl: string
  mediaType: StoryMediaType
  caption: string | null
  expiresAt: string
  createdAt: string
  viewCount: number
  hasViewed: boolean
}

/** Story feed user — user with their active stories */
export interface StoryFeedUser {
  userId: string
  firstName: string
  avatarUrl: string | null
  isVerified: boolean
  hasUnviewed: boolean
  stories: StoryItem[]
}

/** Presigned upload URL response — POST /stories/upload-url */
export interface StoryUploadUrlResponse {
  uploadUrl: string
  mediaUrl: string
  key: string
}

/** Create story response — POST /stories */
export interface CreateStoryResponse {
  id: string
  expiresAt: string
}

// ── Gamification (Badges + Streak + Leaderboard) ──────────

/** Badge category groupings */
export type BadgeCategory = 'social' | 'engagement' | 'milestone' | 'special'

/** Badge definition — static config, not from DB */
export interface BadgeDefinition {
  badgeId: string
  name: string
  description: string
  category: BadgeCategory
  iconUrl: string
  tokenReward: number
}

/** Earned badge — from DB, returned to client */
export interface BadgeItem {
  badgeId: string
  name: string
  description: string | null
  iconUrl: string | null
  tokenReward: number
  isDisplayed: boolean
  earnedAt: string
}

/** Streak status — returned by GET /badges/streak */
export interface StreakResult {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  todayRecorded: boolean
  nextMilestone: number | null
  nextMilestoneReward: number | null
}

/** Leaderboard category */
export type LeaderboardCategory = 'gifters' | 'streamers' | 'matchers' | 'streakers'

/** Single leaderboard entry */
export interface LeaderboardEntry {
  rank: number
  userId: string
  firstName: string
  avatarUrl: string | null
  isVerified: boolean
  score: number
}

/** Leaderboard response — for a specific category */
export interface LeaderboardResponse {
  category: LeaderboardCategory
  weekStart: string
  entries: LeaderboardEntry[]
  myRank: number | null
  myScore: number | null
}

// ── Referrals ──────────────────────────────────────────────

/** Referral status */
export type ReferralStatus = 'pending' | 'completed' | 'expired'

/** Response from GET /referrals/code */
export interface ReferralCodeResponse {
  referralCode: string
  inviterBonus: number
  inviteeBonus: number
}

/** Response from POST /referrals/apply */
export interface ReferralApplyResponse {
  success: boolean
  bonusAwarded: number
}

// ── Bundles (Subscription + Token combos) ──────────────────

/** Bundle tier identifiers */
export type BundleTier = 'starter' | 'power' | 'mega'

/** Bundle package definition — subscription + token combo at a discount */
export interface BundlePackage {
  id: BundleTier
  name: string
  plan: SubscriptionPlan
  billingInterval: BillingInterval
  bonusTokens: number
  priceUsd: number // in cents
  savingsPercent: number
}

/** Available bundle packages */
export const BUNDLE_PACKAGES: BundlePackage[] = [
  {
    id: 'starter',
    name: 'Starter Bundle',
    plan: 'premium',
    billingInterval: 'monthly',
    bonusTokens: 500,
    priceUsd: 2499, // $24.99
    savingsPercent: 15,
  },
  {
    id: 'power',
    name: 'Power Bundle',
    plan: 'premium',
    billingInterval: 'yearly',
    bonusTokens: 2000,
    priceUsd: 4999, // $49.99
    savingsPercent: 25,
  },
  {
    id: 'mega',
    name: 'Mega Bundle',
    plan: 'platinum',
    billingInterval: 'yearly',
    bonusTokens: 5000,
    priceUsd: 8999, // $89.99
    savingsPercent: 35,
  },
]

// ── Voice Profile ──────────────────────────────────────────

/** Presigned upload URL response for voice notes */
export interface VoiceNoteUploadUrlResponse {
  uploadUrl: string
  mediaUrl: string
  key: string
}

// ── Anti-Ghosting ──────────────────────────────────────────

/** Rematch response — POST /matching/:matchId/rematch */
export interface RematchResponse {
  matchId: string
  newExpiresAt: string
  tokensCharged: number
}
