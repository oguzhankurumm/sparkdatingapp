'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toggle } from '@spark/ui'
import {
  CaretLeft,
  Shield,
  Phone,
  MapPin,
  Eye,
  EyeSlash,
  Users,
  UserCircle,
  Images,
} from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Privacy Settings Page
// ──────────────────────────────────────────────

type CallPermission = 'everyone' | 'matches' | 'nobody'
type LocationPrecision = 'exact' | 'approximate' | 'hidden'

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Call permissions
  const [callPerm, setCallPerm] = useState<CallPermission>('everyone')
  // Location
  const [locationPrecision, setLocationPrecision] = useState<LocationPrecision>('approximate')
  // Read receipts
  const [readReceipts, setReadReceipts] = useState(true)
  // Profile visibility
  const [profileVisible, setProfileVisible] = useState(true)
  // Online status
  const [showOnline, setShowOnline] = useState(true)
  // Photo privacy
  const [photosPrivate, setPhotosPrivate] = useState(false)

  const updateSetting = useCallback(async (key: string, value: unknown) => {
    setSaving(true)
    try {
      await api.patch('/users/me/settings', { [key]: value })
    } finally {
      setSaving(false)
    }
  }, [])

  const callOptions: { value: CallPermission; label: string; icon: React.ReactNode }[] = [
    { value: 'everyone', label: 'Everyone', icon: <Users className="h-4 w-4" /> },
    { value: 'matches', label: 'Matches Only', icon: <UserCircle className="h-4 w-4" /> },
    { value: 'nobody', label: 'Nobody', icon: <Phone className="h-4 w-4" /> },
  ]

  const locationOptions: { value: LocationPrecision; label: string; sublabel: string }[] = [
    { value: 'exact', label: 'Exact', sublabel: 'Show your city & distance' },
    { value: 'approximate', label: 'Approximate', sublabel: 'Show region only' },
    { value: 'hidden', label: 'Hidden', sublabel: "Don't share location" },
  ]

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-4">
        <button
          onClick={() => router.back()}
          className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Go back"
        >
          <CaretLeft className="h-5 w-5" />
        </button>
        <h1 className="text-text-primary text-xl font-bold">Privacy</h1>
      </div>

      <div className="space-y-6 px-4">
        {/* ─── Who Can Call Me ─── */}
        <PrivacySection
          title="Who Can Call Me"
          icon={Phone}
          description="Control who can initiate video calls with you"
        >
          <div className="space-y-2">
            {callOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setCallPerm(opt.value)
                  updateSetting('callPermission', opt.value)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                  callPerm === opt.value
                    ? 'bg-primary/10 border-primary border'
                    : 'border-border hover:bg-surface border'
                }`}
              >
                <span className={callPerm === opt.value ? 'text-primary' : 'text-text-muted'}>
                  {opt.icon}
                </span>
                <span
                  className={`text-sm font-medium ${
                    callPerm === opt.value ? 'text-primary' : 'text-text-primary'
                  }`}
                >
                  {opt.label}
                </span>
                {callPerm === opt.value && (
                  <div className="bg-primary ml-auto h-2 w-2 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </PrivacySection>

        {/* ─── Location Sharing ─── */}
        <PrivacySection
          title="Location Sharing"
          icon={MapPin}
          description="Choose how much location info others can see"
        >
          <div className="space-y-2">
            {locationOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setLocationPrecision(opt.value)
                  updateSetting('locationPrecision', opt.value)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                  locationPrecision === opt.value
                    ? 'bg-primary/10 border-primary border'
                    : 'border-border hover:bg-surface border'
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-medium ${
                      locationPrecision === opt.value ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-text-muted text-xs">{opt.sublabel}</p>
                </div>
                {locationPrecision === opt.value && (
                  <div className="bg-primary h-2 w-2 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </PrivacySection>

        {/* ─── Read Receipts ─── */}
        <PrivacySection
          title="Read Receipts"
          icon={Eye}
          description="When enabled, others can see when you've read their messages"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {readReceipts ? (
                <Eye className="text-primary h-4 w-4" />
              ) : (
                <EyeSlash className="text-text-muted h-4 w-4" />
              )}
              <span className="text-text-primary text-sm font-medium">
                {readReceipts ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <Toggle
              checked={readReceipts}
              onChange={(v) => {
                setReadReceipts(v)
                updateSetting('readReceipts', v)
              }}
              disabled={saving}
            />
          </div>
        </PrivacySection>

        {/* ─── Profile Visibility ─── */}
        <PrivacySection
          title="Profile Visibility"
          icon={Shield}
          description="Control whether your profile appears in Discovery"
        >
          <div className="flex items-center justify-between">
            <span className="text-text-primary text-sm font-medium">
              {profileVisible ? 'Visible in Discovery' : 'Hidden from Discovery'}
            </span>
            <Toggle
              checked={profileVisible}
              onChange={(v) => {
                setProfileVisible(v)
                updateSetting('profileVisible', v)
              }}
              disabled={saving}
            />
          </div>
          {!profileVisible && (
            <p className="text-text-muted mt-2 text-xs">
              Your profile won&apos;t appear in swipe/browse. Existing matches can still message
              you.
            </p>
          )}
        </PrivacySection>

        {/* ─── Online Status ─── */}
        <PrivacySection
          title="Show Online Status"
          icon={Shield}
          description="Let others see when you're active"
        >
          <div className="flex items-center justify-between">
            <span className="text-text-primary text-sm font-medium">
              {showOnline ? 'Online status visible' : 'Online status hidden'}
            </span>
            <Toggle
              checked={showOnline}
              onChange={(v) => {
                setShowOnline(v)
                updateSetting('showOnlineStatus', v)
              }}
              disabled={saving}
            />
          </div>
        </PrivacySection>

        {/* ─── Photo Privacy ─── */}
        <PrivacySection
          title="Private Photos"
          icon={Images}
          description="When enabled, your photos are blurred for non-matches. Others can unlock them for 100 tokens."
        >
          <div className="flex items-center justify-between">
            <span className="text-text-primary text-sm font-medium">
              {photosPrivate ? 'Photos are private' : 'Photos are public'}
            </span>
            <Toggle
              checked={photosPrivate}
              onChange={(v) => {
                setPhotosPrivate(v)
                updateSetting('isPhotosPrivate', v)
              }}
              disabled={saving}
            />
          </div>
          {photosPrivate && (
            <p className="text-text-muted mt-2 text-xs">
              Non-matches will see blurred photos. They can spend 100 tokens to unlock your full
              photos. Matches always see clear photos.
            </p>
          )}
        </PrivacySection>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Section Component
// ──────────────────────────────────────────────

function PrivacySection({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border bg-surface-elevated rounded-2xl border p-4">
      <div className="mb-3">
        <div className="mb-1 flex items-center gap-2">
          <Icon className="text-text-muted h-4 w-4" />
          <h3 className="text-text-primary text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-text-muted text-xs">{description}</p>
      </div>
      {children}
    </div>
  )
}
