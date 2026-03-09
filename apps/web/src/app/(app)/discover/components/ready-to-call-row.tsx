'use client'

import Link from 'next/link'
import { Avatar, Skeleton } from '@spark/ui'
import { CaretRight } from '@phosphor-icons/react'
import { useReadyToCall } from '../hooks'

export function ReadyToCallRow() {
  const { data, isLoading } = useReadyToCall()

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-heading text-text-primary text-lg font-bold">Ready to Chat</h2>
        <Link href="/calls" className="text-primary flex items-center gap-0.5 text-sm font-medium">
          See all
          <CaretRight size={14} weight="bold" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton variant="avatar" size="lg" className="h-16 w-16" />
                <Skeleton variant="text" className="h-3 w-12" />
              </div>
            ))
          : data?.users.map((user) => (
              <button key={user.id} type="button" className="flex flex-col items-center gap-1.5">
                <Avatar
                  src={user.avatarUrl}
                  alt={user.firstName}
                  fallback={user.firstName}
                  size="xl"
                  ring="story"
                  online
                />
                <span className="text-text-secondary w-16 truncate text-center text-xs">
                  {user.firstName}
                </span>
                {user.city ? (
                  <span className="text-text-muted w-16 truncate text-center text-[10px]">
                    {user.city}
                  </span>
                ) : null}
              </button>
            ))}

        {/* Empty state */}
        {!isLoading && (!data?.users || data.users.length === 0) ? (
          <p className="text-text-muted py-4 text-sm">
            No one is ready to chat right now. Check back later!
          </p>
        ) : null}
      </div>
    </section>
  )
}
