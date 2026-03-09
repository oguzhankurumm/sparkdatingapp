'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@spark/ui'
import { TOKEN_ECONOMY, COIN_PACKAGES } from '@spark/types'
import type { WalletTransactionItem, CoinPackageItem } from '@spark/types'
import {
  ArrowLeft,
  Coin,
  ArrowDown,
  ArrowUp,
  Gift,
  PhoneCall,
  Star,
  Rocket,
  CurrencyDollar,
  Users,
  Image as ImageIcon,
} from '@phosphor-icons/react'
import {
  useWalletData,
  useWalletTransactions,
  usePurchaseTokens,
  useRequestWithdrawal,
} from './hooks'

// ──────────────────────────────────────────────
// Transaction type → icon mapping
// ──────────────────────────────────────────────

const TX_TYPE_ICONS: Record<string, React.ReactNode> = {
  credit: <ArrowDown className="text-success h-4 w-4" weight="fill" />,
  debit: <ArrowUp className="text-text-muted h-4 w-4" weight="fill" />,
  signup_bonus: <Star className="h-4 w-4 text-amber-400" weight="fill" />,
  referral_bonus: <Users className="text-primary h-4 w-4" weight="fill" />,
  gift_received: <Gift className="h-4 w-4 text-amber-500" weight="fill" />,
  gift_sent: <Gift className="text-text-muted h-4 w-4" weight="fill" />,
  call_charge: <PhoneCall className="text-primary h-4 w-4" weight="fill" />,
  call_earning: <PhoneCall className="text-success h-4 w-4" weight="fill" />,
  boost_purchase: <Rocket className="text-primary h-4 w-4" weight="fill" />,
  photo_unlock: <ImageIcon className="text-primary h-4 w-4" weight="fill" />,
  daily_spin: <Star className="h-4 w-4 text-amber-400" weight="fill" />,
  subscription_bonus: <CurrencyDollar className="text-primary h-4 w-4" weight="fill" />,
  admin_adjustment: <Coin className="text-text-muted h-4 w-4" weight="fill" />,
  table_create: <Users className="text-primary h-4 w-4" weight="fill" />,
  table_join: <Users className="text-primary h-4 w-4" weight="fill" />,
  rematch_purchase: <Star className="text-primary h-4 w-4" weight="fill" />,
}

function getTxIcon(type: string) {
  return TX_TYPE_ICONS[type] ?? <Coin className="text-text-muted h-4 w-4" weight="fill" />
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter()
  const { data: wallet, isLoading: walletLoading } = useWalletData()
  const { data: txData, isLoading: txLoading } = useWalletTransactions()
  const [showBundles, setShowBundles] = useState(false)

  const purchaseMutation = usePurchaseTokens()
  const withdrawMutation = useRequestWithdrawal()

  if (walletLoading) return <WalletSkeleton />

  const balance = wallet?.balance ?? 0
  const totalEarned = wallet?.totalEarned ?? 0
  const totalSpent = wallet?.totalSpent ?? 0
  const pendingWithdrawal = wallet?.pendingWithdrawal ?? 0
  const transactions = txData?.transactions ?? []

  const canWithdraw = balance >= TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS

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
        <p className="mt-0.5 text-sm text-white/60">
          ≈ ${(balance / TOKEN_ECONOMY.USD_TO_TOKENS).toFixed(2)} USD
        </p>

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
            onClick={() =>
              withdrawMutation.mutate({
                amount: wallet?.withdrawableBalance ?? 0,
                method: 'stripe',
              })
            }
          >
            <ArrowUp className="h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Minimum withdrawal notice */}
      {!canWithdraw && (
        <p className="text-text-muted mx-4 mt-2 text-xs">
          Min withdrawal: {TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS.toLocaleString()} tokens (~$
          {TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS / TOKEN_ECONOMY.USD_TO_TOKENS}). You need{' '}
          {(TOKEN_ECONOMY.MIN_WITHDRAWAL_TOKENS - balance).toLocaleString()} more.
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
            {pendingWithdrawal.toLocaleString()} tokens pending withdrawal
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
          <p className="text-text-muted mb-5 text-sm">
            1 USD = {TOKEN_ECONOMY.USD_TO_TOKENS} tokens
          </p>

          <div className="space-y-2">
            {COIN_PACKAGES.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={() => purchaseMutation.mutate(pkg.id)}
                disabled={purchaseMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Transaction history ─── */}
      <div className="mt-6 px-4">
        <h2 className="text-text-primary mb-3 text-base font-semibold">
          Transaction History
          {txData && txData.total > 0 && (
            <span className="text-text-muted ml-1.5 text-xs font-normal">({txData.total})</span>
          )}
        </h2>

        {txLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-surface h-14 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Coin className="text-text-muted h-10 w-10" />
            <p className="text-text-muted text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function CoinPackageCard({
  pkg,
  onPurchase,
  disabled,
}: {
  pkg: CoinPackageItem
  onPurchase: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onPurchase}
      disabled={disabled}
      className={[
        'relative w-full rounded-2xl border p-4 text-left transition-all',
        pkg.popular
          ? 'border-primary bg-primary/5'
          : 'border-border bg-surface hover:border-primary/50',
      ].join(' ')}
    >
      {pkg.popular && (
        <span className="bg-primary absolute -top-2 left-4 rounded-full px-3 py-0.5 text-xs font-bold text-white">
          Most Popular
        </span>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-primary font-semibold">
            {pkg.tokens.toLocaleString()} tokens
            {pkg.bonusTokens > 0 && (
              <span className="text-success ml-1.5 text-sm font-normal">
                +{pkg.bonusTokens.toLocaleString()} bonus
              </span>
            )}
          </p>
          <p className="text-text-muted text-xs">{pkg.name}</p>
        </div>
        <div className="text-right">
          <p className="text-text-primary text-lg font-bold">${(pkg.priceUsd / 100).toFixed(2)}</p>
        </div>
      </div>
    </button>
  )
}

function TransactionRow({ tx }: { tx: WalletTransactionItem }) {
  const isCredit = tx.amount > 0

  return (
    <div className="hover:bg-surface flex items-center gap-3 rounded-xl px-3 py-3 transition-colors">
      <div className="bg-surface-elevated flex h-10 w-10 items-center justify-center rounded-xl">
        {getTxIcon(tx.type)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-text-primary text-sm font-medium">
          {tx.description ?? tx.type.replaceAll('_', ' ')}
        </p>
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
        className={['text-sm font-semibold', isCredit ? 'text-success' : 'text-text-primary'].join(
          ' ',
        )}
      >
        {isCredit ? '+' : '−'}
        {Math.abs(tx.amount).toLocaleString()}
      </p>
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
