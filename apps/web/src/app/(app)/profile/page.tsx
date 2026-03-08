'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Button, Input } from '@spark/ui'
import { ThemeToggleConnected } from '@/components/theme-toggle-connected'
import { useCurrentUser, useLogout } from '@/lib/hooks/use-auth'
import { api } from '@/lib/api-client'
import {
  User as UserIcon,
  Shield,
  Download,
  Trash,
  FileText,
  Gear,
  Globe,
  Bell,
  SignOut,
  Warning,
  CaretRight,
  X,
} from '@phosphor-icons/react'

// ──────────────────────────────────────────────
// Profile Page
// ──────────────────────────────────────────────

export default function ProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser()
  const logoutMutation = useLogout()
  const router = useRouter()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync()
    router.push('/')
  }, [logoutMutation, router])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-text-secondary">Unable to load your profile.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="text-text-primary mb-6 text-2xl font-bold">Profile & Settings</h1>

      {/* ─── Profile Section ─── */}
      <SectionCard>
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} fallback={user.firstName.charAt(0)} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-text-primary truncate text-lg font-semibold">{user.firstName}</p>
              {user.isVerified && (
                <Badge variant="verified" size="sm">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-text-secondary truncate text-sm">{user.email}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" className="mt-4 w-full sm:mt-0 sm:w-auto">
          <UserIcon className="h-4 w-4" />
          Edit Profile
        </Button>
      </SectionCard>

      {/* ─── Privacy & Data Section ─── */}
      <SectionHeader icon={Shield} title="Privacy & Data" />
      <SectionCard>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-text-primary text-sm font-medium">Download My Data</p>
              <p className="text-text-muted text-xs">
                Get a copy of all your personal data in JSON format
              </p>
            </div>
            <DownloadDataButton />
          </div>

          <div className="border-border-subtle border-t" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-text-primary text-sm font-medium">Delete Account</p>
              <p className="text-text-muted text-xs">
                Permanently remove your account and all data
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
              <Trash className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ─── Legal Links Section ─── */}
      <SectionHeader icon={FileText} title="Legal" />
      <SectionCard>
        <div className="space-y-1">
          <LegalLink href="/privacy" label="Privacy Policy" />
          <LegalLink href="/terms" label="Terms of Service" />
          <LegalLink href="/kvkk" label="KVKK Aydinlatma Metni" />
        </div>
      </SectionCard>

      {/* ─── App Settings Section ─── */}
      <SectionHeader icon={Gear} title="App Settings" />
      <SectionCard>
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-surface text-text-secondary flex h-8 w-8 items-center justify-center rounded-lg">
                <Gear className="h-4 w-4" />
              </div>
              <p className="text-text-primary text-sm font-medium">Theme</p>
            </div>
            <ThemeToggleConnected />
          </div>

          <div className="border-border-subtle border-t" />

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-surface text-text-secondary flex h-8 w-8 items-center justify-center rounded-lg">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium">Language</p>
                <p className="text-text-muted text-xs">English</p>
              </div>
            </div>
            <CaretRight className="text-text-muted h-4 w-4" />
          </div>

          <div className="border-border-subtle border-t" />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-surface text-text-secondary flex h-8 w-8 items-center justify-center rounded-lg">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium">Notifications</p>
                <p className="text-text-muted text-xs">Push, email, in-app</p>
              </div>
            </div>
            <CaretRight className="text-text-muted h-4 w-4" />
          </div>
        </div>
      </SectionCard>

      {/* ─── Log Out ─── */}
      <div className="mt-6">
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

      {/* ─── Delete Account Modal ─── */}
      {deleteModalOpen && <DeleteAccountModal onClose={() => setDeleteModalOpen(false)} />}
    </div>
  )
}

// ──────────────────────────────────────────────
// Download Data Button
// ──────────────────────────────────────────────

function DownloadDataButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.post<Record<string, unknown>>('/users/me/export')

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spark-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" size="sm" onClick={handleDownload} loading={loading}>
        <Download className="h-4 w-4" />
        Download
      </Button>
      {error && <p className="text-danger text-xs">{error}</p>}
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="border-border bg-surface-elevated relative w-full max-w-md rounded-2xl border p-6 shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="text-text-muted hover:bg-surface hover:text-text-primary absolute right-4 top-4 rounded-lg p-1 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 1 ? (
          <>
            {/* Step 1: Warning */}
            <div className="bg-danger/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Warning className="text-danger h-6 w-6" weight="fill" />
            </div>
            <h2 className="text-text-primary mb-2 text-lg font-semibold">Delete Your Account?</h2>
            <p className="text-text-secondary mb-6 text-sm leading-relaxed">
              Are you sure? Your account will be deactivated for 30 days before permanent deletion.
              During this period, you can reactivate by logging in. After 30 days, all your data
              including matches, messages, photos, and tokens will be permanently deleted.
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
            {/* Step 2: Confirm by typing DELETE */}
            <div className="bg-danger/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <Trash className="text-danger h-6 w-6" weight="fill" />
            </div>
            <h2 className="text-text-primary mb-2 text-lg font-semibold">Confirm Deletion</h2>
            <p className="text-text-secondary mb-4 text-sm">
              Type <span className="text-danger font-mono font-semibold">DELETE</span> below to
              confirm account deletion.
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
// Helper Components
// ──────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2">
      <Icon className="text-text-muted h-4 w-4" />
      <h2 className="text-text-muted text-sm font-semibold uppercase tracking-wider">{title}</h2>
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface-elevated rounded-xl border p-4 sm:p-5">{children}</div>
  )
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as never}
      className="text-text-secondary hover:bg-surface hover:text-text-primary flex items-center justify-between rounded-lg px-2 py-2.5 text-sm transition-colors"
    >
      <span>{label}</span>
      <CaretRight className="text-text-muted h-4 w-4" />
    </Link>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <div className="bg-surface mb-6 h-8 w-48 animate-pulse rounded-lg" />
      <div className="border-border bg-surface-elevated rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <div className="bg-surface h-14 w-14 animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-surface h-5 w-32 animate-pulse rounded" />
            <div className="bg-surface h-4 w-48 animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface h-12 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
