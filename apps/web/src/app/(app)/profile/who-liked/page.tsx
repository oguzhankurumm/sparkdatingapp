'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button, Avatar } from '@spark/ui'
import { ArrowLeft, Heart, Lock, Crown, Star } from '@phosphor-icons/react'
import { api } from '@/lib/api-client'
import { useCurrentUser } from '@/lib/hooks/use-auth'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface LikedByUser {
  id: string
  firstName: string
  age: number
  avatarUrl: string | null
  isVerified: boolean
  plan: 'free' | 'premium' | 'platinum'
  likedAt: string
  isSuperLike: boolean
}

interface WhoLikedResponse {
  users: LikedByUser[]
  totalCount: number
  // For free female users — how many are visible today
  visibleToday?: number
  maxVisibleToday?: number
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

function useWhoLiked() {
  return useQuery({
    queryKey: ['who-liked-me'],
    queryFn: () => api.get<WhoLikedResponse>('/users/me/likes-received'),
    staleTime: 2 * 60 * 1000,
  })
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function WhoLikedPage() {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const { data, isLoading } = useWhoLiked()

  const plan = user?.plan ?? 'free'
  const gender = user?.gender ?? 'male'

  // Blur gate logic:
  // - Free male: all blurred (must upgrade)
  // - Free female: first 5 per day visible, rest blurred
  // - Premium+: all visible
  const isPremium = plan === 'premium' || plan === 'platinum'
  const isFreeMale = !isPremium && gender === 'male'
  const isFreeFemale = !isPremium && gender === 'female'

  const users = data?.users ?? []
  const totalCount = data?.totalCount ?? 0
  const visibleCount = data?.visibleToday ?? (isPremium ? totalCount : 5)

  if (isLoading) return <WhoLikedSkeleton />

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
        <h1 className="text-text-primary text-base font-semibold">Who Liked Me</h1>
        <div className="flex h-9 w-9 items-center justify-center">
          {!isPremium && <Lock className="text-text-muted h-4 w-4" />}
        </div>
      </div>

      {/* ─── Count banner ─── */}
      <div className="border-border bg-surface-elevated mx-4 mt-4 rounded-2xl border p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Heart className="text-like h-5 w-5" weight="fill" />
          <p className="text-text-primary text-lg font-bold">{totalCount.toLocaleString()}</p>
        </div>
        <p className="text-text-muted mt-0.5 text-sm">
          {isPremium
            ? 'people liked your profile'
            : isFreeFemale
              ? `people liked you · ${visibleCount}/${data?.maxVisibleToday ?? 5} visible today`
              : 'people liked your profile · upgrade to see who'}
        </p>
      </div>

      {/* ─── Paywall (free male) ─── */}
      {isFreeMale && <PaywallBanner onUpgrade={() => router.push('/profile/subscription')} />}

      {/* ─── Female free: daily limit notice ─── */}
      {isFreeFemale && (
        <div className="border-primary/20 bg-primary/5 mx-4 mt-3 rounded-xl border px-4 py-3">
          <p className="text-primary text-sm">
            ⚡ You can see {data?.maxVisibleToday ?? 5} people who liked you per day.{' '}
            <button
              onClick={() => router.push('/profile/subscription')}
              className="font-semibold underline"
            >
              Upgrade for unlimited
            </button>
          </p>
        </div>
      )}

      {/* ─── User grid ─── */}
      {users.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 px-4">
          {users.map((likedByUser, idx) => {
            const isBlurred = isFreeMale || (isFreeFemale && idx >= (data?.maxVisibleToday ?? 5))

            return (
              <LikedByCard
                key={likedByUser.id}
                user={likedByUser}
                blurred={isBlurred}
                onTap={() => {
                  if (isBlurred) {
                    router.push('/profile/subscription')
                  } else {
                    router.push(`/profile/${likedByUser.id}`)
                  }
                }}
              />
            )
          })}
        </div>
      ) : (
        !isFreeMale && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Heart className="text-text-muted h-12 w-12" />
            <p className="text-text-primary font-semibold">No likes yet</p>
            <p className="text-text-muted text-sm">Complete your profile to attract more people</p>
            <Button variant="secondary" size="sm" onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </Button>
          </div>
        )
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function LikedByCard({
  user,
  blurred,
  onTap,
}: {
  user: LikedByUser
  blurred: boolean
  onTap: () => void
}) {
  return (
    <button
      onClick={onTap}
      className="bg-surface-elevated relative overflow-hidden rounded-3xl transition-transform active:scale-[0.98]"
    >
      {/* Avatar / photo area */}
      <div className={['relative aspect-[3/4]', blurred ? 'blur-xl' : ''].join(' ')}>
        <Avatar
          src={blurred ? null : user.avatarUrl}
          fallback={user.firstName.charAt(0)}
          size="2xl"
          className="h-full w-full rounded-none"
        />
        {/* Super like indicator */}
        {user.isSuperLike && !blurred && (
          <div className="bg-super-like absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white">
            <Star className="h-3.5 w-3.5" weight="fill" />
          </div>
        )}
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className={blurred ? 'blur-sm' : ''}>
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold text-white">
              {blurred ? '•••••' : `${user.firstName}, ${user.age}`}
            </p>
          </div>
        </div>
      </div>

      {/* Lock overlay */}
      {blurred && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Lock className="text-text-primary h-5 w-5" />
          </div>
          <span className="bg-primary rounded-full px-3 py-1 text-xs font-semibold text-white">
            Upgrade to see
          </span>
        </div>
      )}
    </button>
  )
}

function PaywallBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="from-primary to-secondary mx-4 mt-4 overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white">
      <Crown className="mb-3 h-8 w-8 text-white/80" weight="fill" />
      <h3 className="text-xl font-bold">See Who Likes You</h3>
      <p className="mt-1 text-sm text-white/70">
        Upgrade to Premium to unlock all your admirers and match instantly.
      </p>
      <Button
        variant="secondary"
        className="mt-4 border-white/20 bg-white/15 text-white hover:bg-white/25"
        onClick={onUpgrade}
      >
        Upgrade Now →
      </Button>
    </div>
  )
}

function WhoLikedSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="bg-surface mb-4 h-20 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-surface aspect-[3/4] animate-pulse rounded-3xl" />
        ))}
      </div>
    </div>
  )
}
