'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Toggle } from '@spark/ui'
import { X } from '@phosphor-icons/react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface CookiePreferences {
  essential: true // Always on — not toggleable
  analytics: boolean
  marketing: boolean
}

interface StoredConsent {
  preferences: CookiePreferences
  timestamp: number // Unix ms — consent expires after 14 months
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STORAGE_KEY = 'spark_cookie_consent'
const FOURTEEN_MONTHS_MS = 14 * 30 * 24 * 60 * 60 * 1000 // ~14 months in ms

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getStoredConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as StoredConsent

    // Validate shape
    if (!parsed.preferences || typeof parsed.timestamp !== 'number') {
      return null
    }

    // Check expiry (14 months)
    const elapsed = Date.now() - parsed.timestamp
    if (elapsed > FOURTEEN_MONTHS_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function storeConsent(preferences: CookiePreferences): void {
  const consent: StoredConsent = {
    preferences,
    timestamp: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      setVisible(true)
    }
  }, [])

  const handleAcceptAll = useCallback(() => {
    const allOn: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    }
    storeConsent(allOn)
    setVisible(false)
  }, [])

  const handleEssentialOnly = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    }
    storeConsent(essentialOnly)
    setVisible(false)
  }, [])

  const handleSaveCustom = useCallback(() => {
    storeConsent(preferences)
    setVisible(false)
  }, [preferences])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-toast)] p-4 sm:p-6">
      <div className="border-border bg-surface-elevated/95 mx-auto max-w-2xl rounded-2xl border shadow-lg backdrop-blur-lg">
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 className="text-text-primary text-base font-semibold">Cookie Preferences</h2>
            <button
              onClick={handleEssentialOnly}
              className="text-text-muted hover:bg-surface hover:text-text-primary shrink-0 rounded-lg p-1 transition-colors"
              aria-label="Dismiss cookie banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-text-secondary mb-5 text-sm leading-relaxed">
            We use cookies to improve your experience, analyze traffic, and personalize content. You
            can choose which cookies to allow.{' '}
            <Link
              href={'/privacy' as never}
              className="text-primary underline-offset-2 hover:underline"
            >
              Learn more
            </Link>
          </p>

          {/* Customize Panel */}
          {showCustomize && (
            <div className="border-border bg-surface mb-5 space-y-3 rounded-xl border p-4">
              <CookieCategory
                name="Essential"
                description="Required for the app to function. Cannot be disabled."
                checked={true}
                disabled={true}
              />
              <div className="border-border-subtle border-t" />
              <CookieCategory
                name="Analytics"
                description="Help us understand how you use Spark to improve the experience."
                checked={preferences.analytics}
                onChange={(checked) => setPreferences((prev) => ({ ...prev, analytics: checked }))}
              />
              <div className="border-border-subtle border-t" />
              <CookieCategory
                name="Marketing"
                description="Used to show you relevant content and measure ad effectiveness."
                checked={preferences.marketing}
                onChange={(checked) => setPreferences((prev) => ({ ...prev, marketing: checked }))}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setShowCustomize((prev) => !prev)}
              className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
            >
              {showCustomize ? 'Hide options' : 'Customize'}
            </button>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleEssentialOnly}>
                Essential Only
              </Button>
              {showCustomize ? (
                <Button variant="primary" size="sm" onClick={handleSaveCustom}>
                  Save Preferences
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleAcceptAll}>
                  Accept All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// CookieCategory row
// ──────────────────────────────────────────────

function CookieCategory({
  name,
  description,
  checked,
  disabled,
  onChange,
}: {
  name: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-sm font-medium">{name}</p>
        <p className="text-text-muted mt-0.5 text-xs">{description}</p>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        size="sm"
        aria-label={`${name} cookies`}
      />
    </div>
  )
}
