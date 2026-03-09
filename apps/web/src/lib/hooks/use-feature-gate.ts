'use client'

import { useState, useCallback } from 'react'
import { useSubscription } from '@/app/(app)/profile/subscription/hooks'
import type { PlanFeatures } from '@spark/types'

/**
 * Feature gating hook — checks if the user has access to a specific feature
 * based on their subscription plan's resolved features.
 *
 * Returns access status + modal controls for the UpgradeModal.
 *
 * Usage:
 *   const { hasAccess, requireAccess, showUpgrade, dismissUpgrade, featureName } = useFeatureGate('datingHelper')
 *   // In a click handler:
 *   if (!requireAccess()) return // opens UpgradeModal if no access
 *   // proceed with feature...
 */
export function useFeatureGate(feature: keyof PlanFeatures) {
  const { data: subscription } = useSubscription()
  const [showUpgrade, setShowUpgrade] = useState(false)

  const features = subscription?.features
  const featureValue = features?.[feature]

  // A feature is accessible if its value is truthy (true, > 0, Infinity)
  const hasAccess = featureValue === true || (typeof featureValue === 'number' && featureValue > 0)

  /**
   * Call this before performing a gated action.
   * Returns true if user has access, false if blocked (shows UpgradeModal).
   */
  const requireAccess = useCallback(() => {
    if (hasAccess) return true
    setShowUpgrade(true)
    return false
  }, [hasAccess])

  const dismissUpgrade = useCallback(() => {
    setShowUpgrade(false)
  }, [])

  return {
    /** Whether the user's plan grants access to this feature */
    hasAccess,
    /** Call before a gated action — returns false and opens modal if no access */
    requireAccess,
    /** Whether the upgrade modal should be shown */
    showUpgrade,
    /** Close the upgrade modal */
    dismissUpgrade,
    /** The feature key being gated (for the modal to display) */
    featureName: feature,
  }
}
