'use client'

import { Badge, Skeleton } from '@spark/ui'
import { TrendUp, SealCheck } from '@phosphor-icons/react'
import { useTrending } from '../hooks'

export function TrendingGrid() {
  const { data, isLoading } = useTrending()

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-heading text-text-primary text-lg font-bold">Trending This Week</h2>
        <div className="text-text-muted flex items-center gap-1 text-sm">
          <TrendUp size={16} weight="bold" className="text-like" />
          <span>Hot</span>
        </div>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl">
                <Skeleton variant="card" className="aspect-[3/4]" />
              </div>
            ))
          : data?.profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className="bg-surface group relative overflow-hidden rounded-xl shadow-sm transition-transform active:scale-[0.98]"
              >
                {/* Photo */}
                <div className="relative aspect-[3/4]">
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.firstName}, ${profile.age}`}
                    className="h-full w-full object-cover"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Trending badge */}
                  <div className="absolute left-2 top-2">
                    <Badge variant="new" size="sm">
                      <TrendUp size={10} weight="bold" />
                      Trending
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-white">
                        {profile.firstName}, {profile.age}
                      </h3>
                      {profile.isVerified ? (
                        <SealCheck size={14} weight="fill" className="text-super-like" />
                      ) : null}
                    </div>
                    {profile.city ? (
                      <p className="mt-0.5 text-xs text-white/70">{profile.city}</p>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && (!data?.profiles || data.profiles.length === 0) ? (
        <p className="text-text-muted px-4 py-4 text-sm">No trending profiles yet. Be the first!</p>
      ) : null}
    </section>
  )
}
