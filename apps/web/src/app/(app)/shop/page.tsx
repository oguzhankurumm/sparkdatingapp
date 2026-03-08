'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@spark/ui'
import { ArrowLeft, Coin } from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface GiftItem {
  id: string
  emoji: string
  name: string
  tokenCost: number
  category: GiftCategory
  isPopular?: boolean
  isPremium?: boolean
}

type GiftCategory = 'flowers' | 'sweets' | 'luxury' | 'fun' | 'music' | 'animals'

interface SendGiftResponse {
  success: boolean
  newBalance: number
}

// ──────────────────────────────────────────────
// Static gift catalog
// 1 USD = 100 tokens; platform keeps 20%, recipient earns 80%
// ──────────────────────────────────────────────

const GIFT_CATALOG: GiftItem[] = [
  // Flowers
  { id: 'rose', emoji: '🌹', name: 'Rose', tokenCost: 100, category: 'flowers', isPopular: true },
  { id: 'bouquet', emoji: '💐', name: 'Bouquet', tokenCost: 500, category: 'flowers' },
  { id: 'sunflower', emoji: '🌻', name: 'Sunflower', tokenCost: 150, category: 'flowers' },
  {
    id: 'cherry_blossom',
    emoji: '🌸',
    name: 'Cherry Blossom',
    tokenCost: 200,
    category: 'flowers',
  },

  // Sweets
  {
    id: 'chocolate',
    emoji: '🍫',
    name: 'Chocolate',
    tokenCost: 200,
    category: 'sweets',
    isPopular: true,
  },
  { id: 'candy', emoji: '🍬', name: 'Candy', tokenCost: 100, category: 'sweets' },
  { id: 'cake', emoji: '🎂', name: 'Cake', tokenCost: 500, category: 'sweets' },
  { id: 'lollipop', emoji: '🍭', name: 'Lollipop', tokenCost: 150, category: 'sweets' },

  // Luxury
  {
    id: 'ring',
    emoji: '💍',
    name: 'Diamond Ring',
    tokenCost: 5000,
    category: 'luxury',
    isPremium: true,
  },
  { id: 'crown', emoji: '👑', name: 'Crown', tokenCost: 2000, category: 'luxury', isPremium: true },
  {
    id: 'champagne',
    emoji: '🍾',
    name: 'Champagne',
    tokenCost: 1000,
    category: 'luxury',
    isPremium: true,
  },
  {
    id: 'sports_car',
    emoji: '🏎️',
    name: 'Sports Car',
    tokenCost: 10000,
    category: 'luxury',
    isPremium: true,
  },

  // Fun
  { id: 'party_popper', emoji: '🎉', name: 'Party Popper', tokenCost: 300, category: 'fun' },
  { id: 'balloon', emoji: '🎈', name: 'Balloon', tokenCost: 150, category: 'fun', isPopular: true },
  { id: 'fireworks', emoji: '🎆', name: 'Fireworks', tokenCost: 800, category: 'fun' },
  { id: 'trophy', emoji: '🏆', name: 'Trophy', tokenCost: 600, category: 'fun' },

  // Music
  { id: 'guitar', emoji: '🎸', name: 'Guitar', tokenCost: 400, category: 'music' },
  { id: 'microphone', emoji: '🎤', name: 'Microphone', tokenCost: 350, category: 'music' },
  { id: 'headphones', emoji: '🎧', name: 'Headphones', tokenCost: 500, category: 'music' },
  { id: 'vinyl', emoji: '🎵', name: 'Vinyl Record', tokenCost: 250, category: 'music' },

  // Animals
  { id: 'puppy', emoji: '🐶', name: 'Puppy', tokenCost: 300, category: 'animals', isPopular: true },
  { id: 'kitty', emoji: '🐱', name: 'Kitten', tokenCost: 300, category: 'animals' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', tokenCost: 400, category: 'animals' },
  { id: 'flamingo', emoji: '🦩', name: 'Flamingo', tokenCost: 450, category: 'animals' },
]

const CATEGORY_LABELS: Record<GiftCategory, string> = {
  flowers: '🌸 Flowers',
  sweets: '🍬 Sweets',
  luxury: '💍 Luxury',
  fun: '🎉 Fun',
  music: '🎵 Music',
  animals: '🐾 Animals',
}

const CATEGORIES: GiftCategory[] = ['flowers', 'sweets', 'luxury', 'fun', 'music', 'animals']

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

function useWalletBalance() {
  return useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => api.get<{ balance: number }>('/wallet/me/balance'),
    staleTime: 30 * 1000,
  })
}

function useSendGift(recipientId: string | null) {
  return useMutation({
    mutationFn: ({ giftId, context }: { giftId: string; context: 'chat' | 'call' | 'stream' }) =>
      api.post<SendGiftResponse>('/gifts/send', {
        recipientId,
        giftId,
        context,
      }),
  })
}

// ──────────────────────────────────────────────
// Inner page (needs Suspense for useSearchParams)
// ──────────────────────────────────────────────

function ShopContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recipientId = searchParams.get('recipientId')

  const [activeCategory, setActiveCategory] = useState<GiftCategory | 'all'>('all')
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null)
  const [sentGiftId, setSentGiftId] = useState<string | null>(null)

  const { data: walletData } = useWalletBalance()
  const balance = walletData?.balance ?? 0

  const sendGiftMutation = useSendGift(recipientId)

  const filteredGifts =
    activeCategory === 'all'
      ? GIFT_CATALOG
      : GIFT_CATALOG.filter((g) => g.category === activeCategory)

  // Sending a gift
  async function handleSend(gift: GiftItem) {
    if (!recipientId) return

    try {
      await sendGiftMutation.mutateAsync({ giftId: gift.id, context: 'chat' })
      setSentGiftId(gift.id)
      setSelectedGift(null)

      // Clear success state after 2 s
      setTimeout(() => setSentGiftId(null), 2000)
    } catch {
      // error handled by mutation state
    }
  }

  const isSending = sendGiftMutation.isPending
  const sendError = sendGiftMutation.isError

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

        <h1 className="text-text-primary text-base font-semibold">
          {recipientId ? 'Send a Gift' : 'Gift Shop'}
        </h1>

        {/* Wallet balance chip */}
        <div className="bg-surface-elevated text-text-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold">
          <Coin className="h-4 w-4 text-amber-500" weight="fill" />
          {balance.toLocaleString()}
        </div>
      </div>

      {/* ─── Recipient hint ─── */}
      {recipientId && (
        <div className="border-primary/20 bg-primary/5 mx-4 mt-4 rounded-xl border px-4 py-3">
          <p className="text-primary text-sm">
            🎁 Select a gift below to send. They'll receive 80% of the token value.
          </p>
        </div>
      )}

      {/* ─── Category tabs ─── */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden">
        <CategoryTab
          label="All"
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
        />
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat}
            label={CATEGORY_LABELS[cat]}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* ─── Gift grid ─── */}
      <div className="mt-4 grid grid-cols-3 gap-3 px-4 sm:grid-cols-4">
        {filteredGifts.map((gift) => {
          const justSent = sentGiftId === gift.id
          const canAfford = balance >= gift.tokenCost

          return (
            <GiftCard
              key={gift.id}
              gift={gift}
              justSent={justSent}
              canAfford={canAfford}
              hasRecipient={!!recipientId}
              onSelect={() => {
                if (recipientId) {
                  setSelectedGift(gift)
                }
              }}
            />
          )
        })}
      </div>

      {/* ─── How it works (no recipient) ─── */}
      {!recipientId && (
        <div className="border-border bg-surface-elevated mx-4 mt-8 rounded-2xl border p-5">
          <h3 className="text-text-primary mb-3 text-sm font-semibold">How Gifts Work</h3>
          <ul className="space-y-2">
            {[
              '💌 Send gifts to anyone — no match required',
              '💰 Recipient earns 80% of the token value instantly',
              '🌟 Gifts appear on their profile as top gifts',
              '📞 Send gifts during chats, calls, or live streams',
            ].map((line) => (
              <li key={line} className="text-text-secondary text-sm">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Confirmation bottom sheet ─── */}
      {selectedGift && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50"
            onClick={() => !isSending && setSelectedGift(null)}
          />
          <div className="animate-sheet-up bg-background fixed bottom-0 left-0 right-0 z-[300] mx-auto max-w-2xl rounded-[32px_32px_0_0] p-6 pb-10 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-text-primary text-lg font-bold">Confirm Gift</h3>
              <button
                onClick={() => !isSending && setSelectedGift(null)}
                className="text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            {/* Gift preview */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <span className="text-7xl">{selectedGift.emoji}</span>
              <p className="text-text-primary text-lg font-semibold">{selectedGift.name}</p>
              <div className="text-text-secondary flex items-center gap-1 text-sm">
                <Coin className="h-4 w-4 text-amber-500" weight="fill" />
                <span className="text-text-primary font-semibold">
                  {selectedGift.tokenCost.toLocaleString()}
                </span>
                <span>tokens</span>
              </div>
              <p className="text-text-muted text-xs">
                Your balance after: {(balance - selectedGift.tokenCost).toLocaleString()} tokens
              </p>
            </div>

            {/* Insufficient balance warning */}
            {balance < selectedGift.tokenCost && (
              <div className="bg-danger/10 mb-4 rounded-xl px-4 py-3 text-center">
                <p className="text-danger text-sm font-medium">
                  Not enough tokens.{' '}
                  <button
                    onClick={() => router.push('/profile/wallet')}
                    className="font-semibold underline"
                  >
                    Top up wallet
                  </button>
                </p>
              </div>
            )}

            {sendError && (
              <p className="text-danger mb-4 text-center text-sm">
                Something went wrong. Please try again.
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSending || balance < selectedGift.tokenCost}
              onClick={() => handleSend(selectedGift)}
            >
              {isSending ? 'Sending…' : `Send ${selectedGift.name} 🎁`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-surface text-text-secondary hover:bg-surface-elevated',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function GiftCard({
  gift,
  justSent,
  canAfford,
  hasRecipient,
  onSelect,
}: {
  gift: GiftItem
  justSent: boolean
  canAfford: boolean
  hasRecipient: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!hasRecipient}
      className={[
        'relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all',
        hasRecipient
          ? canAfford
            ? 'border-border bg-surface-elevated hover:border-primary/50 active:scale-[0.97]'
            : 'border-border bg-surface-elevated opacity-50'
          : 'border-border bg-surface-elevated cursor-default',
        justSent ? 'border-success/50 bg-success/10' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Popular / Premium badges */}
      {gift.isPremium && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
          LUXURY
        </span>
      )}
      {gift.isPopular && !gift.isPremium && (
        <span className="bg-primary absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold text-white">
          POPULAR
        </span>
      )}

      {/* Emoji */}
      <span className="text-4xl">{justSent ? '✅' : gift.emoji}</span>

      {/* Name */}
      <p className="text-text-primary text-center text-xs font-medium leading-tight">
        {justSent ? 'Sent!' : gift.name}
      </p>

      {/* Token cost */}
      <div className="flex items-center gap-0.5">
        <Coin className="h-3 w-3 text-amber-500" weight="fill" />
        <span className="text-text-secondary text-xs">{gift.tokenCost.toLocaleString()}</span>
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────
// Page export — Suspense wraps useSearchParams()
// ──────────────────────────────────────────────

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  )
}

function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="bg-surface mb-4 h-10 w-48 animate-pulse rounded-full" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-surface aspect-square animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
