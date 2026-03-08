'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Button, PillTag, ThemeToggle, Skeleton, NotificationPanel } from '@spark/ui'
import {
  PencilSimple,
  Gear,
  Star,
  Heart,
  ChatCircle,
  Gift,
  Coin,
  Crown,
  CheckCircle,
  Globe,
  ArrowRight,
} from '@phosphor-icons/react'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAllAsRead,
  useMarkAsRead,
} from '@/lib/hooks/use-notifications'
import { api } from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface UserProfile {
  id: string
  firstName: string
  age: number
  gender: 'male' | 'female' | 'non_binary'
  avatarUrl: string | null
  photos: { id: string; url: string; isPrimary: boolean }[]
  isVerified: boolean
  plan: 'free' | 'premium' | 'platinum'
  bio: string | null
  zodiacSign: string | null
  prompts: { question: string; answer: string }[]
  interests: string[]
  stats: { matches: number; tableJoins: number; giftsReceived: number }
  topGifts: { emoji: string; name: string; count: number }[]
  tokenBalance: number
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

function useUserProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => api.get<UserProfile>('/users/me/profile'),
    staleTime: 2 * 60 * 1000,
  })
}

// ──────────────────────────────────────────────
// Profile Page
// ──────────────────────────────────────────────

export default function ProfilePage() {
  const { data: authUser } = useCurrentUser()
  const { data: profile, isLoading } = useUserProfile()
  const router = useRouter()

  // Notification data
  const { data: notificationsData } = useNotificationsList(10, 0)
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllRead = useMarkAllAsRead()

  if (isLoading) return <ProfileSkeleton />

  // Fallback for API not yet wired up — render with auth user data
  const displayName = profile?.firstName ?? authUser?.firstName ?? ''
  const avatarUrl = profile?.avatarUrl ?? authUser?.avatarUrl ?? null
  const plan = profile?.plan ?? authUser?.plan ?? 'free'
  const isVerified = profile?.isVerified ?? authUser?.isVerified ?? false
  const zodiac = profile?.zodiacSign ?? null
  const photos = profile?.photos ?? []
  const prompts = profile?.prompts ?? []
  const interests = profile?.interests ?? []
  const stats = profile?.stats ?? { matches: 0, tableJoins: 0, giftsReceived: 0 }
  const topGifts = profile?.topGifts ?? []

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => router.push('/profile/settings')}
            className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label="Language"
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <NotificationPanel
            notifications={notificationsData?.data ?? []}
            unreadCount={unreadData?.count ?? 0}
            onNotificationClick={(n) => {
              if (!n.read) markAsRead.mutate(n.id)
              router.push('/notifications')
            }}
            onMarkAllRead={() => markAllRead.mutate()}
            onViewAll={() => router.push('/notifications')}
          />
          <button
            onClick={() => router.push('/profile/settings')}
            className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
            aria-label="Settings"
          >
            <Gear className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ─── Hero: Avatar + name + badges ─── */}
      <div className="flex flex-col items-center px-4 py-4 text-center">
        <div className="relative mb-3">
          <Avatar
            src={avatarUrl}
            fallback={displayName.charAt(0)}
            size="2xl"
            className="ring-4 ring-white dark:ring-black/20"
          />
          {plan === 'platinum' && (
            <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <Crown className="h-3.5 w-3.5 text-white" weight="fill" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-text-primary text-2xl font-bold">{displayName}</h1>
          {isVerified && <CheckCircle className="text-primary h-5 w-5" weight="fill" />}
        </div>

        {/* Plan badge */}
        {plan !== 'free' && (
          <Badge
            variant="plan"
            plan={plan === 'platinum' ? 'platinum' : 'premium'}
            size="sm"
            className="mt-1"
          >
            {plan === 'platinum' ? '👑 Platinum' : '⚡ Premium'}
          </Badge>
        )}

        {/* Zodiac */}
        {zodiac && (
          <button className="text-text-secondary mt-2 flex items-center gap-1.5 text-sm">
            <span>{ZODIAC_EMOJIS[zodiac] ?? '✨'}</span>
            <span>{zodiac}</span>
          </button>
        )}

        {/* Edit profile button */}
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/profile/edit')}
        >
          <PencilSimple className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* ─── Stats ─── */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
        <StatCard
          icon={<Heart className="h-5 w-5" weight="fill" />}
          value={stats.matches}
          label="Matches"
          color="text-like"
        />
        <StatCard
          icon={<ChatCircle className="h-5 w-5" weight="fill" />}
          value={stats.tableJoins}
          label="Tables"
          color="text-primary"
        />
        <StatCard
          icon={<Gift className="h-5 w-5" weight="fill" />}
          value={stats.giftsReceived}
          label="Gifts"
          color="text-amber-500"
        />
      </div>

      {/* ─── Photo Grid ─── */}
      {photos.length > 0 && (
        <Section title="Photos" action={{ label: 'Edit', href: '/profile/edit' }}>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.slice(0, 6).map((photo, idx) => (
              <div
                key={photo.id}
                className="bg-surface relative aspect-[3/4] overflow-hidden rounded-xl"
              >
                <Image src={photo.url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                {photo.isPrimary && (
                  <div className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                    Main
                  </div>
                )}
              </div>
            ))}
            {/* Add photo slot */}
            {photos.length < 6 && (
              <Link
                href="/profile/edit"
                className="border-border-subtle bg-surface flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors"
              >
                <span className="text-text-muted text-2xl">+</span>
                <span className="text-text-muted text-xs">Add photo</span>
              </Link>
            )}
          </div>
        </Section>
      )}

      {/* ─── Prompts ─── */}
      {prompts.length > 0 && (
        <Section title="About Me" action={{ label: 'Edit', href: '/profile/edit' }}>
          <div className="space-y-3">
            {prompts.map((p, idx) => (
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
      {interests.length > 0 && (
        <Section title="Interests">
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => (
              <PillTag key={tag} variant="default">
                {tag}
              </PillTag>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Gift Showcase ─── */}
      {topGifts.length > 0 && (
        <Section title="Top Gifts Received">
          <div className="grid grid-cols-3 gap-3">
            {topGifts.slice(0, 6).map((gift) => (
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

      {/* ─── Quick links ─── */}
      <Section title="Account">
        <div className="space-y-1">
          <QuickLink
            href="/profile/wallet"
            icon={<Coin className="h-5 w-5" />}
            label="Wallet"
            sublabel="Tokens & purchases"
          />
          <QuickLink
            href="/profile/subscription"
            icon={<Star className="h-5 w-5" />}
            label="Subscription"
            sublabel={
              plan === 'free'
                ? 'Upgrade to Premium'
                : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`
            }
          />
          <QuickLink
            href="/profile/who-liked"
            icon={<Heart className="h-5 w-5" />}
            label="Who Liked Me"
            sublabel={plan === 'free' ? 'Upgrade to see' : 'See your admirers'}
          />
        </div>
      </Section>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: string
}) {
  return (
    <div className="border-border bg-surface-elevated flex flex-col items-center gap-1 rounded-2xl border p-3">
      <span className={color}>{icon}</span>
      <span className="text-text-primary text-xl font-bold">{value}</span>
      <span className="text-text-muted text-xs">{label}</span>
    </div>
  )
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: { label: string; href: string }
}) {
  return (
    <div className="mb-6 px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-text-primary text-base font-semibold">{title}</h2>
        {action && (
          <Link href={action.href as never} className="text-primary text-sm font-medium">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function QuickLink({
  href,
  icon,
  label,
  sublabel,
}: {
  href: string
  icon: React.ReactNode
  label: string
  sublabel?: string
}) {
  return (
    <Link
      href={href as never}
      className="text-text-primary hover:bg-surface flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
    >
      <div className="text-text-secondary bg-surface flex h-9 w-9 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && <p className="text-text-muted text-xs">{sublabel}</p>}
      </div>
      <ArrowRight className="text-text-muted h-4 w-4" />
    </Link>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex flex-col items-center gap-3">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
