'use client'

import * as amplitude from '@amplitude/analytics-browser'

let initialized = false

/**
 * Initialize Amplitude. Call once in the root layout/provider.
 * No-ops if NEXT_PUBLIC_AMPLITUDE_API_KEY is not set.
 */
export function initAnalytics() {
  if (initialized) return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return

  amplitude.init(apiKey, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
      formInteractions: true,
      fileDownloads: false,
    },
  })
  initialized = true
}

/** Identify a logged-in user */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  const identifyEvent = new amplitude.Identify()
  if (properties) {
    for (const [key, value] of Object.entries(properties)) {
      identifyEvent.set(key, value as string | number | boolean)
    }
  }
  amplitude.setUserId(userId)
  amplitude.identify(identifyEvent)
}

/** Clear identity on logout */
export function resetAnalytics() {
  if (!initialized) return
  amplitude.reset()
}

/** Track a custom event */
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  amplitude.track(name, properties)
}

// ── Typed event helpers ─────────────────────────

export const analytics = {
  // Auth
  signUp: (method: 'email' | 'google' | 'apple') => trackEvent('sign_up', { method }),
  login: (method: 'email' | 'google' | 'apple') => trackEvent('login', { method }),
  logout: () => trackEvent('logout'),

  // Discovery
  profileViewed: (targetUserId: string) =>
    trackEvent('profile_viewed', { target_user_id: targetUserId }),
  swipeAction: (action: 'like' | 'pass' | 'super_like', targetUserId: string) =>
    trackEvent('swipe_action', { action, target_user_id: targetUserId }),

  // Matching
  matchCreated: (matchId: string) => trackEvent('match_created', { match_id: matchId }),

  // Messaging
  messageSent: (matchId: string) => trackEvent('message_sent', { match_id: matchId }),

  // Gifts
  giftSent: (giftTypeId: string, tokensCost: number, context: string) =>
    trackEvent('gift_sent', { gift_type_id: giftTypeId, tokens_cost: tokensCost, context }),

  // Calls
  callStarted: (callType: 'video' | 'audio') => trackEvent('call_started', { call_type: callType }),
  callEnded: (durationSeconds: number) =>
    trackEvent('call_ended', { duration_seconds: durationSeconds }),

  // Wallet
  tokensPurchased: (packageId: string, amount: number) =>
    trackEvent('tokens_purchased', { package_id: packageId, amount }),

  // Subscription
  subscriptionStarted: (plan: string, billing: string) =>
    trackEvent('subscription_started', { plan, billing }),
  subscriptionCancelled: (plan: string) => trackEvent('subscription_cancelled', { plan }),

  // Tables
  tableCreated: (tableId: string) => trackEvent('table_created', { table_id: tableId }),
  tableJoined: (tableId: string) => trackEvent('table_joined', { table_id: tableId }),

  // Boost
  boostActivated: (boostType: string, tokensCost: number) =>
    trackEvent('boost_activated', { boost_type: boostType, tokens_cost: tokensCost }),

  // Page views (supplementary to auto-tracking)
  screenViewed: (screenName: string) => trackEvent('screen_viewed', { screen_name: screenName }),
}
