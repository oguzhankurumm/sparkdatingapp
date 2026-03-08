'use client'

import { use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Avatar, PillTag } from '@spark/ui'
import {
  ArrowLeft,
  Heart,
  PhoneCall,
  Gift,
  CheckCircle,
  Crown,
  Share,
  Flag,
  X,
  Star,
} from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PublicProfile {
  id: string
  firstName: string
  age: number
  gender: 'male' | 'female' | 'non_binary'
  avatarUrl: string | null
  photos: { id: string; url: string }[]
  isVerified: boolean
  plan: 'free' | 'premium' | 'platinum'
  bio: string | null
  zodiacSign: string | null
  prompts: { question: string; answer: string }[]
  interests: string[]
  isReadyForCall: boolean
  callTokenRate: number // tokens per minute
  topGifts: { emoji: string; name: string; count: number }[]
  compatibilityScore: number | null // 0-100, only for Platinum
  distance: number | null // km
}

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
}

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get<PublicProfile>(`/users/${userId}/profile`),
    staleTime: 5 * 60 * 1000,
  })
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const { data: profile, isLoading } = usePublicProfile(userId)

  const likeMutation = useMutation({
    mutationFn: () => api.post('/swipes', { targetUserId: userId, action: 'like' }),
  })

  const superLikeMutation = useMutation({
    mutationFn: () => api.post('/swipes', { targetUserId: userId, action: 'super_like' }),
  })

  if (isLoading) return <ProfileSkeleton />
  if (!profile) return null

  return (
    <div className="mx-auto max-w-2xl pb-28">
      {/* ─── Header ─── */}
      <div className="bg-background/95 sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          className="text-text-secondary hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="More options"
        >
          <Share className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Photo stack ─── */}
      {profile.photos.length > 0 ? (
        <div className="bg-surface relative h-[480px] w-full overflow-hidden">
          <Image
            src={profile.photos[0]!.url}
            alt={profile.firstName}
            fill
            className="object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Name + badges over photo */}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {profile.firstName}, {profile.age}
              </h1>
              {profile.isVerified && <CheckCircle className="h-6 w-6 text-white" weight="fill" />}
              {profile.plan === 'platinum' && (
                <Crown className="h-5 w-5 text-amber-400" weight="fill" />
              )}
            </div>

            {profile.zodiacSign && (
              <p className="mt-1 text-sm text-white/80">
                {ZODIAC_EMOJIS[profile.zodiacSign] ?? '✨'} {profile.zodiacSign}
              </p>
            )}

            {profile.distance !== null && (
              <p className="text-sm text-white/70">{profile.distance} km away</p>
            )}
          </div>

          {/* Photo count dots */}
          {profile.photos.length > 1 && (
            <div className="absolute left-0 right-0 top-4 flex justify-center gap-1">
              {profile.photos.map((_, idx) => (
                <div
                  key={idx}
                  className={[
                    'h-1 rounded-full transition-all',
                    idx === 0 ? 'w-5 bg-white' : 'w-1 bg-white/40',
                  ].join(' ')}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface flex h-64 items-center justify-center">
          <Avatar src={profile.avatarUrl} fallback={profile.firstName.charAt(0)} size="2xl" />
        </div>
      )}

      {/* ─── Action buttons ─── */}
      <div className="flex items-center justify-center gap-4 px-4 py-5">
        {/* Pass */}
        <button className="border-border bg-surface flex h-14 w-14 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95">
          <X className="text-text-secondary h-6 w-6" />
        </button>

        {/* Gift */}
        <button
          onClick={() => router.push(`/shop?recipientId=${userId}`)}
          className="border-border bg-surface flex h-14 w-14 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95"
        >
          <Gift className="h-6 w-6 text-amber-500" />
        </button>

        {/* Like */}
        <button
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
          className="bg-like shadow-like-glow flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-70"
        >
          <Heart className="h-7 w-7 text-white" weight="fill" />
        </button>

        {/* Super Like */}
        <button
          onClick={() => superLikeMutation.mutate()}
          disabled={superLikeMutation.isPending}
          className="border-super-like/30 bg-super-like/10 flex h-14 w-14 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95"
        >
          <Star className="text-super-like h-6 w-6" weight="fill" />
        </button>

        {/* Call (if ready) */}
        {profile.isReadyForCall && (
          <button
            onClick={() =>
              router.push(
                `/calls/new?userId=${userId}` as unknown as Parameters<typeof router.push>[0],
              )
            }
            className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full shadow-sm transition-all active:scale-95"
          >
            <PhoneCall className="text-primary h-6 w-6" weight="fill" />
          </button>
        )}
      </div>

      {/* Call rate badge */}
      {profile.isReadyForCall && (
        <div className="bg-surface-elevated border-border mx-4 mb-4 rounded-xl border p-3 text-center">
          <p className="text-text-muted text-xs">
            📞 Ready for a call ·{' '}
            <span className="text-text-primary font-semibold">
              {profile.callTokenRate} tokens/min
            </span>{' '}
            · No refunds
          </p>
        </div>
      )}

      {/* ─── Compatibility (Platinum) ─── */}
      {profile.compatibilityScore !== null && (
        <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {profile.compatibilityScore}%
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                AI Compatibility Score
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Based on values, interests & communication style
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bio ─── */}
      {profile.bio && (
        <Section title="About">
          <p className="text-text-primary text-sm leading-relaxed">{profile.bio}</p>
        </Section>
      )}

      {/* ─── Prompts ─── */}
      {profile.prompts.length > 0 && (
        <Section title="Get to Know Me">
          <div className="space-y-3">
            {profile.prompts.map((p, idx) => (
              <div key={idx} className="border-border bg-surface-elevated rounded-2xl border p-4">
                <p className="text-text-muted mb-1.5 text-xs font-semibold uppercase tracking-wide">
                  {p.question}
                </p>
                <p className="text-text-primary text-base leading-relaxed">{p.answer}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Interests ─── */}
      {profile.interests.length > 0 && (
        <Section title="Interests">
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((tag) => (
              <PillTag key={tag} variant="default">
                {tag}
              </PillTag>
            ))}
          </div>
        </Section>
      )}

      {/* ─── More photos ─── */}
      {profile.photos.length > 1 && (
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-1.5">
            {profile.photos.slice(1).map((photo, idx) => (
              <div
                key={photo.id}
                className="bg-surface relative aspect-[3/4] overflow-hidden rounded-xl"
              >
                <Image src={photo.url} alt={`Photo ${idx + 2}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Top Gifts ─── */}
      {profile.topGifts.length > 0 && (
        <Section title="Top Gifts Received">
          <div className="grid grid-cols-3 gap-3">
            {profile.topGifts.slice(0, 3).map((gift) => (
              <div
                key={gift.name}
                className="border-border bg-surface-elevated flex flex-col items-center gap-1 rounded-2xl border p-3"
              >
                <span className="text-3xl">{gift.emoji}</span>
                <span className="text-text-secondary text-xs">{gift.name}</span>
                <span className="text-text-muted text-xs">×{gift.count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Report / Block ─── */}
      <div className="flex items-center justify-center gap-6 px-4 pb-4 pt-2">
        <button className="text-text-muted hover:text-danger flex items-center gap-1.5 text-xs transition-colors">
          <Flag className="h-4 w-4" />
          Report
        </button>
        <span className="text-border">·</span>
        <button className="text-text-muted hover:text-danger text-xs transition-colors">
          Block
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 px-4">
      <h2 className="text-text-primary mb-3 text-base font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-surface h-[480px] w-full animate-pulse" />
      <div className="px-4 py-6">
        <div className="bg-surface mb-4 h-8 w-48 animate-pulse rounded-lg" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-surface h-20 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
