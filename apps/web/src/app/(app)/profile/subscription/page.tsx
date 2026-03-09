'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Badge } from '@spark/ui'
import { ArrowLeft, Check, Crown, Lightning, X } from '@phosphor-icons/react'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { useCheckout, useManagePortal } from './hooks'
import type { BillingInterval } from '@spark/types'

// ──────────────────────────────────────────────
// Plan data
// ──────────────────────────────────────────────

interface PlanInfo {
  id: 'free' | 'premium' | 'platinum'
  name: string
  icon: React.ReactNode
  monthlyPrice: number
  yearlyMonthlyPrice: number // effective monthly price when billed yearly
  yearlyPrice: number // total charged yearly
  color: string
  features: { label: string; included: boolean }[]
}

const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    icon: null,
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyPrice: 0,
    color: 'text-text-secondary',
    features: [
      { label: 'Limited likes per day', included: true },
      { label: 'Basic matching', included: true },
      { label: 'See who liked you (5/day for women)', included: true },
      { label: 'Unlimited likes', included: false },
      { label: 'Video calls', included: false },
      { label: 'Auto Translate', included: false },
      { label: 'Dating Helper AI', included: false },
      { label: 'Incognito browsing', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: <Lightning className="h-4 w-4" weight="fill" />,
    monthlyPrice: 19.99,
    yearlyMonthlyPrice: 11.99,
    yearlyPrice: 143.88,
    color: 'text-primary',
    features: [
      { label: 'Unlimited likes', included: true },
      { label: 'See who liked you', included: true },
      { label: 'Rewind last swipe', included: true },
      { label: 'Advanced filters', included: true },
      { label: 'Read receipts', included: true },
      { label: 'Auto Translate', included: true },
      { label: '5 Boosts per month', included: true },
      { label: 'Profile viewers', included: true },
      { label: 'Dating Helper AI', included: false },
      { label: 'Incognito browsing', included: false },
      { label: '1000 tokens/month', included: false },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: <Crown className="h-4 w-4" weight="fill" />,
    monthlyPrice: 29.99,
    yearlyMonthlyPrice: 17.99,
    yearlyPrice: 215.88,
    color: 'text-amber-500',
    features: [
      { label: 'Everything in Premium', included: true },
      { label: 'Dating Helper AI', included: true },
      { label: 'Incognito browsing', included: true },
      { label: 'Priority discovery', included: true },
      { label: '1000 bonus tokens/month', included: true },
      { label: 'Platinum badge', included: true },
      { label: 'AI Compatibility details', included: true },
      { label: 'Date Planner AI (3/day)', included: true },
    ],
  },
]

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function SubscriptionPage() {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const [billing, setBilling] = useState<BillingInterval>('yearly')
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'platinum'>(
    user?.plan === 'platinum' ? 'platinum' : 'premium',
  )

  const currentPlan = user?.plan ?? 'free'

  const subscribeMutation = useCheckout()
  const managePortalMutation = useManagePortal()

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* ─── Header ─── */}
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-text-primary text-base font-semibold">Subscription</h1>
        <div className="h-9 w-9" />
      </div>

      {/* ─── Hero ─── */}
      <div className="px-4 py-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-amber-500" weight="fill" />
          <h2 className="text-text-primary text-2xl font-bold">Upgrade Spark</h2>
        </div>
        <p className="text-text-secondary text-sm">
          Get more matches, AI-powered tools, and unlimited access.
        </p>
      </div>

      {/* ─── Billing toggle ─── */}
      <div className="mx-4 mb-6 flex items-center justify-center">
        <div className="border-border bg-surface flex rounded-full border p-1">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              className={[
                'rounded-full px-5 py-2 text-sm font-medium transition-all',
                billing === cycle ? 'bg-primary text-white shadow-sm' : 'text-text-secondary',
              ].join(' ')}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className="bg-success/20 text-success ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  -40%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Plan cards ─── */}
      <div className="space-y-3 px-4">
        {PLANS.filter((p) => p.id !== 'free').map((plan) => {
          const isActive = currentPlan === plan.id
          const isSelected = selectedPlan === plan.id
          const price = billing === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as 'premium' | 'platinum')}
              className={[
                'w-full rounded-2xl border-2 p-4 text-left transition-all',
                isSelected
                  ? plan.id === 'platinum'
                    ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-primary bg-primary/5'
                  : 'border-border bg-surface-elevated',
              ].join(' ')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className={plan.color}>{plan.icon}</span>
                  <div>
                    <p className="text-text-primary font-semibold">{plan.name}</p>
                    <p className="text-text-muted text-xs">
                      {billing === 'yearly' ? `$${plan.yearlyPrice}/year` : 'No commitment'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-text-primary text-xl font-bold">
                    ${price}
                    <span className="text-text-muted text-sm font-normal">/mo</span>
                  </p>
                  {isActive && (
                    <Badge variant="default" size="sm">
                      Current
                    </Badge>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2">
                    {f.included ? (
                      <Check className="text-success h-4 w-4 flex-shrink-0" />
                    ) : (
                      <X className="text-text-muted h-4 w-4 flex-shrink-0" />
                    )}
                    <span
                      className={[
                        'text-sm',
                        f.included ? 'text-text-primary' : 'text-text-muted line-through',
                      ].join(' ')}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      {/* ─── CTA ─── */}
      <div className="px-4 pt-6">
        {currentPlan === 'free' ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() =>
              subscribeMutation.mutate({ planId: selectedPlan, billingCycle: billing })
            }
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending
              ? 'Redirecting…'
              : `Get ${selectedPlan === 'platinum' ? 'Platinum' : 'Premium'} →`}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => managePortalMutation.mutate()}
              disabled={managePortalMutation.isPending}
            >
              {managePortalMutation.isPending ? 'Loading…' : 'Manage Subscription'}
            </Button>
            {currentPlan === 'premium' && (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() =>
                  subscribeMutation.mutate({ planId: 'platinum', billingCycle: billing })
                }
                disabled={subscribeMutation.isPending}
              >
                Upgrade to Platinum →
              </Button>
            )}
          </div>
        )}

        <p className="text-text-muted mt-4 text-center text-xs">
          Cancel anytime · Secure payment via Stripe · Prices in USD
        </p>
      </div>
    </div>
  )
}
