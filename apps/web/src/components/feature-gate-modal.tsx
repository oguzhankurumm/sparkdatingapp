'use client'

import { useRouter } from 'next/navigation'
import { UpgradeModal } from '@spark/ui'
import type { PlanFeatures } from '@spark/types'

/** Human-readable labels for PlanFeatures keys */
const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  dailyLikes: 'Unlimited Likes',
  superLikesPerDay: 'Super Likes',
  canSeeWhoLiked: 'See Who Liked You',
  whoLikedDailyLimit: 'Who Liked You',
  canRewind: 'Rewind',
  boostsPerMonth: 'Profile Boosts',
  advancedFilters: 'Advanced Filters',
  readReceipts: 'Read Receipts',
  incognitoMode: 'Incognito Mode',
  canSeeProfileViewers: 'Profile Viewers',
  autoTranslate: 'Auto Translate',
  datingHelper: 'Dating Helper AI',
  priorityDiscovery: 'Priority Discovery',
  monthlyBonusTokens: 'Monthly Bonus Tokens',
  platinumBadge: 'Platinum Badge',
}

/** Features that require Platinum (not available on Premium) */
const PLATINUM_ONLY: Set<keyof PlanFeatures> = new Set([
  'incognitoMode',
  'datingHelper',
  'priorityDiscovery',
  'monthlyBonusTokens',
  'platinumBadge',
])

interface FeatureGateModalProps {
  feature: keyof PlanFeatures
  open: boolean
  onClose: () => void
}

/**
 * Connects the useFeatureGate hook to the UpgradeModal UI component.
 * Automatically determines the required plan and navigates to checkout.
 */
export function FeatureGateModal({ feature, open, onClose }: FeatureGateModalProps) {
  const router = useRouter()
  const requiredPlan = PLATINUM_ONLY.has(feature) ? 'platinum' : 'premium'
  const label = FEATURE_LABELS[feature] ?? feature

  return (
    <UpgradeModal
      open={open}
      onClose={onClose}
      feature={label}
      requiredPlan={requiredPlan as 'premium' | 'platinum'}
      onUpgrade={() => {
        onClose()
        router.push('/profile/subscription')
      }}
    />
  )
}
