'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Skeleton } from '@spark/ui'
import {
  CaretLeft,
  CreditCard,
  Calendar,
  Warning,
  Crown,
  Lightning,
  CheckCircle,
} from '@phosphor-icons/react'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Manage Subscription Page
// ──────────────────────────────────────────────

export default function ManageSubscriptionPage() {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()
  const [cancelStep, setCancelStep] = useState<'none' | 'confirm' | 'done'>('none')
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = user?.plan ?? 'free'
  const isPaid = plan === 'premium' || plan === 'platinum'

  const handleCancel = useCallback(async () => {
    setCancelling(true)
    setError(null)
    try {
      await api.post('/subscriptions/cancel')
      setCancelStep('done')
    } catch {
      setError('Failed to cancel subscription. Please try again or contact support.')
    } finally {
      setCancelling(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  // Free plan — redirect to subscription page
  if (!isPaid) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="bg-surface mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <CreditCard className="text-text-muted h-8 w-8" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">No Active Subscription</h2>
        <p className="text-text-secondary mb-6 text-sm">
          You&apos;re on the free plan. Upgrade to unlock premium features.
        </p>
        <Button variant="primary" size="md" onClick={() => router.push('/profile/subscription')}>
          View Plans
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
        <h1 className="text-text-primary text-xl font-bold">Manage Subscription</h1>
      </div>

      <div className="space-y-6 px-4">
        {/* Current plan card */}
        <div className="border-border bg-surface-elevated overflow-hidden rounded-2xl border">
          <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-4">
            <div className="flex items-center gap-2">
              {plan === 'platinum' ? (
                <Crown className="h-5 w-5 text-white" weight="fill" />
              ) : (
                <Lightning className="h-5 w-5 text-white" weight="fill" />
              )}
              <span className="text-lg font-bold text-white">
                {plan === 'platinum' ? 'Platinum' : 'Premium'}
              </span>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-text-muted h-4 w-4" />
                <span className="text-text-secondary text-sm">Next billing</span>
              </div>
              <span className="text-text-primary text-sm font-semibold">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-text-muted h-4 w-4" />
                <span className="text-text-secondary text-sm">Amount</span>
              </div>
              <span className="text-text-primary text-sm font-semibold">
                {plan === 'platinum' ? '$29.99/mo' : '$19.99/mo'}
              </span>
            </div>
          </div>
        </div>

        {/* Change plan */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => router.push('/profile/subscription')}
        >
          {plan === 'premium' ? 'Upgrade to Platinum' : 'Change Plan'}
        </Button>

        {/* Cancel section */}
        {cancelStep === 'none' && (
          <div className="border-border rounded-2xl border p-4">
            <Button
              variant="ghost"
              size="md"
              className="text-danger w-full"
              onClick={() => setCancelStep('confirm')}
            >
              Cancel Subscription
            </Button>
          </div>
        )}

        {cancelStep === 'confirm' && (
          <div className="border-danger/20 bg-danger/5 rounded-2xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Warning className="text-danger h-5 w-5" weight="fill" />
              <h3 className="text-text-primary font-semibold">Cancel Subscription?</h3>
            </div>
            <p className="text-text-secondary mb-4 text-sm">
              Your {plan} features will remain active until the end of your current billing period.
              After that, you&apos;ll be downgraded to the free plan.
            </p>
            <ul className="text-text-secondary mb-4 space-y-1 text-sm">
              <li>• You&apos;ll lose unlimited likes & boosts</li>
              <li>• &quot;Who Liked Me&quot; will be hidden</li>
              {plan === 'platinum' && <li>• Dating Helper AI will be disabled</li>}
              <li>• Your matches & messages are kept</li>
            </ul>
            {error && (
              <p className="bg-danger/10 text-danger mb-4 rounded-lg p-3 text-sm">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => setCancelStep('none')}
              >
                Keep Plan
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleCancel}
                loading={cancelling}
              >
                Cancel Plan
              </Button>
            </div>
          </div>
        )}

        {cancelStep === 'done' && (
          <div className="border-border bg-surface-elevated rounded-2xl border p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" weight="fill" />
            <p className="text-text-primary font-semibold">Subscription Cancelled</p>
            <p className="text-text-secondary mt-1 text-sm">
              Your {plan} features remain active until the end of this billing period.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
