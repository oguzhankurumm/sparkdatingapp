'use client'

import { LikesReceivedCard, Skeleton } from '@spark/ui'
import { Heart, CaretRight } from '@phosphor-icons/react'
import { useLikesReceived, useUnlockPhotos } from '../hooks'

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function LikesReceivedRow() {
  const { data, isLoading } = useLikesReceived()
  const unlockMutation = useUnlockPhotos()

  const total = data?.total ?? 0
  const profiles = data?.profiles ?? []

  // Don't render the section if there are no likes
  if (!isLoading && profiles.length === 0) return null

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Heart size={18} weight="fill" className="text-[var(--like)]" />
          <h2 className="font-heading text-text-primary text-lg font-bold">Likes You</h2>
          {total > 0 ? (
            <span className="rounded-full bg-[var(--like)] px-2 py-0.5 text-[10px] font-bold text-white">
              {total}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="text-primary flex items-center gap-0.5 text-sm font-medium"
        >
          See all
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-36 flex-shrink-0">
                <Skeleton variant="card" className="aspect-[3/4] w-full rounded-2xl" />
                <Skeleton variant="text" className="mx-auto mt-2 h-3 w-16" />
              </div>
            ))
          : profiles.map((profile) => (
              <LikesReceivedCard
                key={profile.id}
                photo={profile.avatarUrl}
                name={profile.firstName}
                age={profile.age}
                blurred={profile.blurred}
                timeAgo={formatTimeAgo(profile.likedAt)}
                onUnlock={() => {
                  unlockMutation.mutate(profile.id)
                }}
              />
            ))}
      </div>
    </section>
  )
}
