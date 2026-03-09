'use client'

/**
 * Branch.io deep-linking integration.
 *
 * Branch SDK is loaded via script tag (no npm package needed for web).
 * This module provides typed helpers for creating and tracking deep links.
 *
 * When NEXT_PUBLIC_BRANCH_KEY is not set, all methods gracefully no-op.
 */

declare global {
  interface Window {
    branch?: {
      init: (key: string, callback?: (err: unknown, data: unknown) => void) => void
      link: (data: Record<string, unknown>, callback: (err: unknown, url: string) => void) => void
      track: (event: string, metadata?: Record<string, unknown>) => void
      setIdentity: (userId: string) => void
      logout: () => void
    }
  }
}

let initialized = false

/** Load Branch SDK script and initialize */
export function initBranch(): Promise<void> {
  if (initialized || typeof window === 'undefined') return Promise.resolve()
  const branchKey = process.env.NEXT_PUBLIC_BRANCH_KEY
  if (!branchKey) return Promise.resolve()

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.branch.io/branch-latest.min.js'
    script.async = true
    script.onload = () => {
      window.branch?.init(branchKey, () => {
        initialized = true
        resolve()
      })
    }
    script.onerror = () => resolve() // fail silently
    document.head.appendChild(script)
  })
}

/** Set Branch identity after login */
export function setBranchIdentity(userId: string) {
  if (!initialized) return
  window.branch?.setIdentity(userId)
}

/** Clear Branch identity on logout */
export function clearBranchIdentity() {
  if (!initialized) return
  window.branch?.logout()
}

/** Create a shareable profile deep link */
export function createProfileLink(
  userId: string,
  firstName: string,
  avatarUrl?: string,
): Promise<string | null> {
  if (!initialized) return Promise.resolve(null)

  return new Promise((resolve) => {
    window.branch?.link(
      {
        channel: 'app',
        feature: 'profile_share',
        data: {
          $desktop_url: `${window.location.origin}/profile/${userId}`,
          $ios_url: `spark://profile/${userId}`,
          $android_url: `spark://profile/${userId}`,
          $og_title: `${firstName} on Spark`,
          $og_description: 'Check out this profile on Spark — Dating Reimagined',
          $og_image_url: avatarUrl,
          user_id: userId,
          type: 'profile',
        },
      },
      (err, url) => {
        if (err) {
          resolve(null)
          return
        }
        resolve(url)
      },
    )
  })
}

/** Create a referral invite deep link */
export function createReferralLink(
  referrerId: string,
  referrerName: string,
): Promise<string | null> {
  if (!initialized) return Promise.resolve(null)

  return new Promise((resolve) => {
    window.branch?.link(
      {
        channel: 'referral',
        feature: 'invite',
        data: {
          $desktop_url: `${window.location.origin}/register?ref=${referrerId}`,
          $ios_url: `spark://register?ref=${referrerId}`,
          $android_url: `spark://register?ref=${referrerId}`,
          $og_title: `${referrerName} invited you to Spark`,
          $og_description: 'Join Spark and get 100 free tokens!',
          referrer_id: referrerId,
          type: 'referral',
        },
      },
      (err, url) => {
        if (err) {
          resolve(null)
          return
        }
        resolve(url)
      },
    )
  })
}
