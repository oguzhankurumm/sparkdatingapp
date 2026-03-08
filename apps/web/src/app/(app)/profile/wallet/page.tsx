'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@spark/ui'
import {
  ArrowLeft,
  Coin,
  ArrowDown,
  ArrowUp,
  Gift,
  PhoneCall,
  Star,
  Rocket,
} from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface WalletData {
  balance: number
  totalEarned: number
  totalSpent: number
  pendingWithdrawal: number
  transactions: WalletTx[]
}

interface WalletTx {
  id: string
  type: 'credit' | 'debit'
  category:
    | 'purchase'
    | 'gift_received'
    | 'gift_sent'
    | 'call'
    | 'boost'
    | 'bonus'
    | 'withdrawal'
    | 'refund'
  amount: number
  description: string
  createdAt: string
}

interface TokenBundle {
  id: string
  tokens: number
  price: number // USD
  bonus: number // extra tokens
  popular?: boolean
}

const TOKEN_BUNDLES: TokenBundle[] = [
  { id: 'starter', tokens: 1000, price: 10.99, bonus: 0 },
  { id: 'basic', tokens: 2500, price: 24.99, bonus: 0 },
  { id: 'popular', tokens: 5000, price: 44.99, bonus: 500, popular: true },
  { id: 'value', tokens: 10000, price: 79.99, bonus: 2000 },
  { id: 'pro', tokens: 25000, price: 179.99, bonus: 7500 },
]

const TX_CATEGORY_ICONS: Record<WalletTx['category'], React.ReactNode> = {
  purchase: <Coin className="text-primary h-4 w-4" weight="fill" />,
  gift_received: <Gift className="h-4 w-4 text-amber-500" weight="fill" />,
  gift_sent: <Gift className="text-text-muted h-4 w-4" weight="fill" />,
  call: <PhoneCall className="text-primary h-4 w-4" weight="fill" />,
  boost: <Rocket className="text-primary h-4 w-4" weight="fill" />,
  bonus: <Star className="h-4 w-4 text-amber-400" weight="fill" />,
  withdrawal: <ArrowUp className="text-text-muted h-4 w-4" weight="fill" />,
  refund: <ArrowDown className="text-success h-4 w-4" weight="fill" />,
}

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

function useWallet() {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get<WalletData>('/wallet/me'),
    staleTime: 60 * 1000,
  })
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter()
  const { data: wallet, isLoading } = useWallet()
  const [showBundles, setShowBundles] = useState(false)

  const purchaseMutation = useMutation({
    mutationFn: (bundleId: string) =>
      api.post<{ checkoutUrl: string }>('/wallet/purchase', { bundleId }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: () => api.post('/wallet/withdraw'),
  })

  if (isLoading) return <WalletSkeleton />

  // Fallback values for pre-wired API
  const balance = wallet?.balance ?? 0
  const totalEarned = wallet?.totalEarned ?? 0
  const totalSpent = wallet?.totalSpent ?? 0
  const pendingWithdrawal = wallet?.pendingWithdrawal ?? 0
  const transactions = wallet?.transactions ?? []

  const canWithdraw = balance >= 5000 // 5000 tokens = $50 min

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
        <h1 className="text-text-primary text-base font-semibold">Wallet</h1>
        <div className="h-9 w-9" />
      </div>

      {/* ─── Balance card ─── */}
      <div className="from-primary to-secondary mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl">
        <p className="text-sm font-medium text-white/70">Token Balance</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-5xl font-bold">{balance.toLocaleString()}</span>
          <span className="mb-1 text-lg text-white/70">tokens</span>
        </div>
        <p className="mt-0.5 text-sm text-white/60">≈ ${(balance / 100).toFixed(2)} USD</p>

        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setShowBundles(true)}
          >
            <Coin className="h-4 w-4" />
            Buy Tokens
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
            disabled={!canWithdraw || withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate()}
          >
            <ArrowUp className="h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Minimum withdrawal notice */}
      {!canWithdraw && (
        <p className="text-text-muted mx-4 mt-2 text-xs">
          Min withdrawal: 5,000 tokens (~$50). You need {(5000 - balance).toLocaleString()} more.
        </p>
      )}

      {/* ─── Stats ─── */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="border-border bg-surface-elevated rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <ArrowDown className="text-success h-4 w-4" />
            <p className="text-text-muted text-xs">Total Earned</p>
          </div>
          <p className="text-text-primary mt-1 text-xl font-bold">{totalEarned.toLocaleString()}</p>
        </div>
        <div className="border-border bg-surface-elevated rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <ArrowUp className="text-text-muted h-4 w-4" />
            <p className="text-text-muted text-xs">Total Spent</p>
          </div>
          <p className="text-text-primary mt-1 text-xl font-bold">{totalSpent.toLocaleString()}</p>
        </div>
      </div>

      {pendingWithdrawal > 0 && (
        <div className="border-warning/30 bg-warning/10 mx-4 mt-3 rounded-xl border px-4 py-3">
          <p className="text-warning text-sm">
            ⏳ {pendingWithdrawal.toLocaleString()} tokens pending withdrawal
          </p>
        </div>
      )}

      {/* ─── Buy Tokens Modal / Panel ─── */}
      {showBundles && (
        <div
          className="z-modal-backdrop fixed inset-0 bg-black/50"
          onClick={() => setShowBundles(false)}
        />
      )}
      {showBundles && (
        <div className="z-modal animate-sheet-up bg-background fixed bottom-0 left-0 right-0 mx-auto max-w-2xl rounded-[32px_32px_0_0] p-6 pb-10 shadow-xl">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-text-primary text-lg font-bold">Buy Tokens</h3>
            <button
              onClick={() => setShowBundles(false)}
              className="text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
          <p className="text-text-muted mb-5 text-sm">1 USD = 100 tokens</p>

          <div className="space-y-2">
            {TOKEN_BUNDLES.map((bundle) => (
              <button
                key={bundle.id}
                onClick={() => purchaseMutation.mutate(bundle.id)}
                disabled={purchaseMutation.isPending}
                className={[
                  'relative w-full rounded-2xl border p-4 text-left transition-all',
                  bundle.popular
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-surface hover:border-primary/50',
                ].join(' ')}
              >
                {bundle.popular && (
                  <span className="bg-primary absolute -top-2 left-4 rounded-full px-3 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-semibold">
                      {bundle.tokens.toLocaleString()} tokens
                      {bundle.bonus > 0 && (
                        <span className="text-success ml-1.5 text-sm font-normal">
                          +{bundle.bonus.toLocaleString()} bonus
                        </span>
                      )}
                    </p>
                    <p className="text-text-muted text-xs">
                      ≈ ${((bundle.tokens + bundle.bonus) / 100).toFixed(2)} value
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-primary text-lg font-bold">${bundle.price}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Transaction history ─── */}
      <div className="mt-6 px-4">
        <h2 className="text-text-primary mb-3 text-base font-semibold">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Coin className="text-text-muted h-10 w-10" />
            <p className="text-text-muted text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="hover:bg-surface flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
              >
                <div className="bg-surface-elevated flex h-10 w-10 items-center justify-center rounded-xl">
                  {TX_CATEGORY_ICONS[tx.category]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text-primary text-sm font-medium">{tx.description}</p>
                  <p className="text-text-muted text-xs">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p
                  className={[
                    'text-sm font-semibold',
                    tx.type === 'credit' ? 'text-success' : 'text-text-primary',
                  ].join(' ')}
                >
                  {tx.type === 'credit' ? '+' : '−'}
                  {tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────

function WalletSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="bg-surface mb-4 h-44 animate-pulse rounded-3xl" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-surface h-20 animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface h-14 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}
