'use client'

import { StatsigClient } from '@statsig/js-client'

let client: StatsigClient | null = null
let initialized = false

/**
 * Initialize Statsig. Call once in the root layout/provider.
 * No-ops if NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY is not set.
 */
export async function initFeatureFlags(userId?: string, properties?: Record<string, string>) {
  if (initialized) return
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_SDK_KEY
  if (!sdkKey) return

  client = new StatsigClient(sdkKey, {
    userID: userId ?? '',
    custom: properties,
  })

  await client.initializeAsync()
  initialized = true
}

/** Update the user context (e.g. after login) */
export async function updateFeatureFlagUser(userId: string, properties?: Record<string, string>) {
  if (!client) return
  await client.updateUserAsync({
    userID: userId,
    custom: properties,
  })
}

/** Check a feature gate (boolean flag) */
export function checkGate(gateName: string): boolean {
  if (!client) return false
  return client.checkGate(gateName)
}

/** Get a dynamic config (remote config) */
export function getConfig(configName: string): Record<string, unknown> {
  if (!client) return {}
  const config = client.getDynamicConfig(configName)
  return config.value as Record<string, unknown>
}

/** Get an experiment value */
export function getExperiment(experimentName: string): Record<string, unknown> {
  if (!client) return {}
  const experiment = client.getExperiment(experimentName)
  return experiment.value as Record<string, unknown>
}

// ── Typed gate helpers ─────────────────────────

export const gates = {
  isLiveStreamEnabled: () => checkGate('live_stream_enabled'),
  isSpeedDatingEnabled: () => checkGate('speed_dating_enabled'),
  isStoriesEnabled: () => checkGate('stories_enabled'),
  isAiDatingHelperEnabled: () => checkGate('ai_dating_helper_enabled'),
  isAutoTranslateEnabled: () => checkGate('auto_translate_enabled'),
  isReferralProgramEnabled: () => checkGate('referral_program_enabled'),
  isBranchDeepLinksEnabled: () => checkGate('branch_deep_links_enabled'),
}
