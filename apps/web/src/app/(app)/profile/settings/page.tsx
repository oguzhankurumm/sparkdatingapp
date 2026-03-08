'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Button, Input, Slider, Toggle, Skeleton } from '@spark/ui'
import {
  User,
  Shield,
  Bell,
  Phone,
  Robot,
  CreditCard,
  UserMinus,
  Question,
  Trash,
  CaretLeft,
  CaretRight,
  SignOut,
  Warning,
  X,
  CheckCircle,
  Lock,
} from '@phosphor-icons/react'
import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth'
import { api } from '@/lib/api-client'
import { ThemeToggleConnected } from '@/components/theme-toggle-connected'

// ──────────────────────────────────────────────
// Settings Page
// ──────────────────────────────────────────────

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser()
  const logoutMutation = useLogout()
  const router = useRouter()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync()
    router.push('/')
  }, [logoutMutation, router])

  if (isLoading) return <SettingsSkeleton />

  const plan = user?.plan ?? 'free'
  const isPremium = plan === 'premium' || plan === 'platinum'
  const isPlatinum = plan === 'platinum'

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
        <h1 className="text-text-primary text-xl font-bold">Settings</h1>
      </div>

      {/* ─── Account ─── */}
      <SettingsSection title="Account" icon={User}>
        {user && (
          <div className="mb-4 flex items-center gap-3 px-1">
            <Avatar src={user.avatarUrl} fallback={user.firstName.charAt(0)} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-text-primary font-semibold">{user.firstName}</p>
              <p className="text-text-secondary truncate text-sm">{user.email}</p>
            </div>
            {user.isVerified && (
              <CheckCircle className="text-primary h-5 w-5 shrink-0" weight="fill" />
            )}
          </div>
        )}
        <div className="space-y-1">
          <SettingsRow label="Edit Profile" href="/profile/edit" />
          <SettingsRow label="Change Password" icon={Lock} href="#" />
          <SettingsRow
            label="Verify Account"
            sublabel={user?.isVerified ? 'Verified ✓' : 'Get the blue tick'}
            href="#"
          />
          <SettingsRow label="Phone Number" sublabel="Add for 2FA" href="#" />
        </div>
      </SettingsSection>

      {/* ─── Privacy ─── */}
      <SettingsSection title="Privacy" icon={Shield}>
        <div className="space-y-1">
          <SettingsRow label="Who Can Call Me" sublabel="Everyone" href="#" />
          <SettingsRow label="Location Sharing" sublabel="Approximate only" href="#" />
          <SettingsRow label="Read Receipts" sublabel="On" href="#" />
          <SettingsRow label="Blocked Users" href="/profile/settings/blocked" />
        </div>
      </SettingsSection>

      {/* ─── AI Features ─── */}
      <SettingsSection title="AI Features" icon={Robot}>
        <div className="space-y-4">
          <ToggleRow
            label="Auto Translate"
            sublabel="Translate messages automatically"
            badge={!isPremium ? 'Premium' : undefined}
            disabled={!isPremium}
            defaultChecked={false}
            onToggle={async (v) => {
              if (!isPremium) {
                router.push('/profile/subscription')
                return
              }
              await api.patch('/users/me/settings', { autoTranslate: v })
            }}
          />
          <div className="border-border-subtle border-t" />
          <ToggleRow
            label="Dating Helper AI"
            sublabel="Get AI help during chats"
            badge={!isPlatinum ? 'Platinum' : undefined}
            disabled={!isPlatinum}
            defaultChecked={false}
            onToggle={async (v) => {
              if (!isPlatinum) {
                router.push('/profile/subscription')
                return
              }
              await api.patch('/users/me/settings', { datingHelperEnabled: v })
            }}
          />
        </div>
      </SettingsSection>

      {/* ─── Notifications ─── */}
      <SettingsSection title="Notifications" icon={Bell}>
        <div className="space-y-4">
          <ToggleRow
            label="Push Notifications"
            sublabel="Matches, messages, likes"
            defaultChecked={true}
            onToggle={async (v) => api.patch('/users/me/settings', { pushNotifications: v })}
          />
          <div className="border-border-subtle border-t" />
          <ToggleRow
            label="Email Notifications"
            sublabel="Weekly digest & security"
            defaultChecked={true}
            onToggle={async (v) => api.patch('/users/me/settings', { emailNotifications: v })}
          />
          <div className="border-border-subtle border-t" />
          <ToggleRow
            label="In-App Notifications"
            sublabel="Badges & banners"
            defaultChecked={true}
            onToggle={async (v) => api.patch('/users/me/settings', { inAppNotifications: v })}
          />
        </div>
      </SettingsSection>

      {/* ─── Call Settings ─── */}
      <SettingsSection title="Call Settings" icon={Phone}>
        <CallSettings />
      </SettingsSection>

      {/* ─── Theme ─── */}
      <SettingsSection title="App Settings" icon={undefined}>
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-text-primary text-sm font-medium">Theme</p>
            <p className="text-text-muted text-xs">Light / Dark / System</p>
          </div>
          <ThemeToggleConnected />
        </div>
      </SettingsSection>

      {/* ─── Subscription ─── */}
      <SettingsSection title="Subscription" icon={CreditCard}>
        <div className="space-y-1">
          <div className="mb-3 flex items-center gap-2 px-1">
            <Badge
              variant={plan === 'free' ? 'default' : 'plan'}
              plan={plan !== 'free' ? plan : undefined}
            >
              {plan === 'free' ? 'Free Plan' : plan === 'premium' ? '⚡ Premium' : '👑 Platinum'}
            </Badge>
          </div>
          <SettingsRow label="View Plans & Upgrade" href="/profile/subscription" />
          {isPremium && (
            <SettingsRow label="Manage Subscription" sublabel="Cancel or change plan" href="#" />
          )}
        </div>
      </SettingsSection>

      {/* ─── Help & Legal ─── */}
      <SettingsSection title="Help & Legal" icon={Question}>
        <div className="space-y-1">
          <SettingsRow label="FAQ" href="#" />
          <SettingsRow label="Contact Support" href="#" />
          <SettingsRow label="Privacy Policy" href="/privacy" />
          <SettingsRow label="Terms of Service" href="/terms" />
          <SettingsRow label="KVKK Aydınlatma Metni" href="/kvkk" />
        </div>
      </SettingsSection>

      {/* ─── Danger Zone ─── */}
      <SettingsSection title="Account Actions" icon={Warning}>
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="lg"
            className="text-danger w-full justify-start"
            onClick={() =>
              router.push(
                '/profile/settings/blocked' as unknown as Parameters<typeof router.push>[0],
              )
            }
          >
            <UserMinus className="h-5 w-5" />
            Blocked Users
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-danger w-full justify-start"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Trash className="h-5 w-5" />
            Delete Account
          </Button>
        </div>
      </SettingsSection>

      {/* ─── Log Out ─── */}
      <div className="px-4">
        <Button
          variant="ghost"
          size="lg"
          className="text-danger w-full justify-center"
          onClick={handleLogout}
          loading={logoutMutation.isPending}
        >
          <SignOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>

      {deleteModalOpen && <DeleteAccountModal onClose={() => setDeleteModalOpen(false)} />}
    </div>
  )
}

// ──────────────────────────────────────────────
// Call Settings (with slider)
// ──────────────────────────────────────────────

function CallSettings() {
  const [isReady, setIsReady] = useState(false)
  const [tokenRate, setTokenRate] = useState(30)
  const [saving, setSaving] = useState(false)

  const handleReadyToggle = useCallback(async (val: boolean) => {
    setIsReady(val)
    setSaving(true)
    try {
      await api.patch('/users/me/settings', { isReadyForCall: val })
    } finally {
      setSaving(false)
    }
  }, [])

  const handleRateChange = useCallback(async (val: number) => {
    setTokenRate(val)
    setSaving(true)
    try {
      await api.patch('/users/me/settings', { callTokenRate: val })
    } finally {
      setSaving(false)
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-text-primary text-sm font-medium">Ready for Calls</p>
          <p className="text-text-muted text-xs">
            {isReady ? 'You appear as available to call' : 'You are shown as unavailable'}
          </p>
        </div>
        <Toggle checked={isReady} onChange={handleReadyToggle} disabled={saving} />
      </div>

      {isReady && (
        <div className="px-1">
          <Slider
            label="Token Rate"
            min={10}
            max={100}
            value={tokenRate}
            onChange={handleRateChange}
            showValue
            formatValue={(v) => `${v} t/min`}
          />
          <p className="text-text-muted mt-1.5 text-xs">
            Callers pay {tokenRate} tokens per minute. Platform takes 20%.
          </p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Toggle Row
// ──────────────────────────────────────────────

function ToggleRow({
  label,
  sublabel,
  badge,
  disabled,
  defaultChecked,
  onToggle,
}: {
  label: string
  sublabel?: string
  badge?: string
  disabled?: boolean
  defaultChecked: boolean
  onToggle: (val: boolean) => Promise<void>
}) {
  const [checked, setChecked] = useState(defaultChecked)
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback(
    async (val: boolean) => {
      if (disabled) return
      setChecked(val)
      setLoading(true)
      try {
        await onToggle(val)
      } catch {
        setChecked(!val) // revert
      } finally {
        setLoading(false)
      }
    },
    [disabled, onToggle],
  )

  return (
    <div className="flex items-center justify-between px-1">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium ${disabled ? 'text-text-muted' : 'text-text-primary'}`}
          >
            {label}
          </p>
          {badge && (
            <span className="rounded-full bg-gradient-to-r from-rose-500 to-purple-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              {badge}
            </span>
          )}
        </div>
        {sublabel && <p className="text-text-muted text-xs">{sublabel}</p>}
      </div>
      <Toggle checked={checked} onChange={handleChange} disabled={disabled || loading} />
    </div>
  )
}

// ──────────────────────────────────────────────
// Settings Row (navigation)
// ──────────────────────────────────────────────

function SettingsRow({
  label,
  sublabel,
  href,
  icon: Icon,
}: {
  label: string
  sublabel?: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  const router = useRouter()
  return (
    <button
      onClick={() =>
        href.startsWith('#') ? undefined : router.push(href as Parameters<typeof router.push>[0])
      }
      className="hover:bg-surface flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="text-text-muted h-4 w-4" />}
        <div>
          <p className="text-text-primary text-sm font-medium">{label}</p>
          {sublabel && <p className="text-text-muted text-xs">{sublabel}</p>}
        </div>
      </div>
      <CaretRight className="text-text-muted h-4 w-4" />
    </button>
  )
}

// ──────────────────────────────────────────────
// Settings Section
// ──────────────────────────────────────────────

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="mb-6 px-4">
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="text-text-muted h-4 w-4" />}
        <h2 className="text-text-muted text-xs font-semibold uppercase tracking-wider">{title}</h2>
      </div>
      <div className="border-border bg-surface-elevated rounded-2xl border p-4">{children}</div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Delete Account Modal
// ──────────────────────────────────────────────

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = useCallback(async () => {
    if (confirmText !== 'DELETE') return
    setLoading(true)
    setError(null)
    try {
      await api.delete('/users/me')
      api.clearTokens()
      router.push('/')
    } catch {
      setError('Failed to delete account. Please try again or contact support.')
      setLoading(false)
    }
  }, [confirmText, router])

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="border-border bg-surface-elevated relative w-full max-w-md rounded-2xl border p-6 shadow-lg">
        <button
          onClick={onClose}
          className="text-text-muted hover:bg-surface hover:text-text-primary absolute right-4 top-4 rounded-lg p-1 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 1 ? (
          <>
            <div className="bg-danger/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Warning className="text-danger h-6 w-6" weight="fill" />
            </div>
            <h2 className="text-text-primary mb-2 text-lg font-semibold">Delete Your Account?</h2>
            <p className="text-text-secondary mb-6 text-sm leading-relaxed">
              Your account will be deactivated for 30 days. After that, all your data — matches,
              messages, photos, and tokens — will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="danger" size="md" className="flex-1" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-danger/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Trash className="text-danger h-6 w-6" weight="fill" />
            </div>
            <h2 className="text-text-primary mb-2 text-lg font-semibold">Confirm Deletion</h2>
            <p className="text-text-secondary mb-4 text-sm">
              Type <span className="text-danger font-mono font-semibold">DELETE</span> to confirm.
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="mb-4"
              autoFocus
            />
            {error && (
              <p className="bg-danger/10 text-danger mb-4 rounded-lg p-3 text-sm">{error}</p>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" size="md" className="flex-1" onClick={() => setStep(1)}>
                Go Back
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDelete}
                loading={loading}
                disabled={confirmText !== 'DELETE'}
              >
                Delete Forever
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Skeleton className="mb-6 h-8 w-32 rounded-lg" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-6">
          <Skeleton className="mb-3 h-4 w-24 rounded" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
