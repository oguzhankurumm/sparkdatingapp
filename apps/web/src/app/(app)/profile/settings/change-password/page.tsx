'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@spark/ui'
import { CaretLeft, Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Change Password Page
// ──────────────────────────────────────────────

export default function ChangePasswordPage() {
  const router = useRouter()
  const [current, setCurrent] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isValid = current.length >= 1 && newPw.length >= 8 && newPw === confirm

  const requirements = [
    { label: 'At least 8 characters', met: newPw.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(newPw) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPw) },
    { label: 'Passwords match', met: confirm.length > 0 && newPw === confirm },
  ]

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValid) return
      setLoading(true)
      setError(null)
      try {
        await api.patch('/users/me/password', {
          currentPassword: current,
          newPassword: newPw,
        })
        setSuccess(true)
      } catch {
        setError('Current password is incorrect or something went wrong.')
      } finally {
        setLoading(false)
      }
    },
    [isValid, current, newPw],
  )

  if (success) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" weight="fill" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Password Updated</h2>
        <p className="text-text-secondary mb-6 text-sm">
          Your password has been changed successfully.
        </p>
        <Button variant="primary" size="md" onClick={() => router.back()}>
          Back to Settings
        </Button>
      </div>
    )
  }

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
        <h1 className="text-text-primary text-xl font-bold">Change Password</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4">
        {/* Current password */}
        <div>
          <label className="text-text-primary mb-1.5 block text-sm font-medium">
            Current Password
          </label>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="text-text-muted hover:text-text-primary absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="text-text-primary mb-1.5 block text-sm font-medium">New Password</label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="text-text-muted hover:text-text-primary absolute right-3 top-1/2 -translate-y-1/2"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-text-primary mb-1.5 block text-sm font-medium">
            Confirm New Password
          </label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>

        {/* Requirements */}
        {newPw.length > 0 && (
          <div className="space-y-2">
            {requirements.map((req) => (
              <div key={req.label} className="flex items-center gap-2">
                <div
                  className={`h-1.5 w-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-text-muted'}`}
                />
                <span
                  className={`text-xs ${req.met ? 'text-green-600 dark:text-green-400' : 'text-text-muted'}`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <p className="bg-danger/10 text-danger rounded-lg p-3 text-sm">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!isValid}
        >
          Update Password
        </Button>
      </form>
    </div>
  )
}
