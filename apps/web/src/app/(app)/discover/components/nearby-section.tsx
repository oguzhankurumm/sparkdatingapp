'use client'

import { Avatar, Skeleton } from '@spark/ui'
import { MapPin } from '@phosphor-icons/react'
import { useNearbyUsers } from '../hooks'

export function NearbySection() {
  const { data, isLoading } = useNearbyUsers()

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-heading text-text-primary text-lg font-bold">People Nearby</h2>
        <div className="text-text-muted flex items-center gap-1 text-xs">
          <MapPin size={12} weight="fill" className="text-like" />
          <span>Location-based</span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-1 px-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                <Skeleton variant="avatar" size="md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" className="h-4 w-24" />
                  <Skeleton variant="text" className="h-3 w-16" />
                </div>
              </div>
            ))
          : data?.users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="hover:bg-surface-elevated active:bg-surface-elevated flex w-full items-center gap-3 rounded-xl p-3 transition-colors"
              >
                <Avatar
                  src={user.avatarUrl}
                  alt={user.firstName}
                  fallback={user.firstName}
                  size="lg"
                />
                <div className="flex-1 text-left">
                  <h3 className="text-text-primary text-sm font-semibold">{user.firstName}</h3>
                  <div className="text-text-muted mt-0.5 flex items-center gap-1 text-xs">
                    <MapPin size={10} weight="fill" />
                    <span>Nearby</span>
                  </div>
                </div>
                <div className="text-primary text-xs font-medium">View</div>
              </button>
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && (!data?.users || data.users.length === 0) ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8">
          <MapPin size={32} className="text-text-muted" />
          <p className="text-text-muted text-sm">Enable location to see people nearby</p>
        </div>
      ) : null}
    </section>
  )
}
