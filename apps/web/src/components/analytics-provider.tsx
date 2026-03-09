'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'
import { initFeatureFlags } from '@/lib/feature-flags'

/**
 * Client component that initializes analytics (Amplitude) and
 * feature flags (Statsig) on mount. Drop into the root layout.
 *
 * Both SDKs gracefully no-op when their env vars are absent,
 * so this is safe in local dev without any keys configured.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics()
    initFeatureFlags()
  }, [])

  return <>{children}</>
}
