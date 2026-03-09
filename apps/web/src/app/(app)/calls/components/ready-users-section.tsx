'use client'

import { VideoCamera } from '@phosphor-icons/react'
import { Skeleton } from '@spark/ui'
import { useReadyForCallUsers, useInitiateCall } from '../hooks'
import { ReadyUserCard } from './ready-user-card'

export function ReadyUsersSection() {
  const { data: users, isLoading } = useReadyForCallUsers()
  const initiateCall = useInitiateCall()

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-text-primary px-1 text-base font-semibold">Ready for Call</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex w-[140px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl p-4"
            >
              <Skeleton variant="avatar" className="h-12 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (!users || users.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-text-primary px-1 text-base font-semibold">Ready for Call</h2>
        <div className="bg-surface flex flex-col items-center gap-2 rounded-2xl py-10">
          <VideoCamera size={32} weight="light" className="text-text-muted" />
          <p className="text-text-muted text-sm">No users available right now</p>
          <p className="text-text-muted text-xs">Check back soon!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-text-primary px-1 text-base font-semibold">
        Ready for Call
        <span className="text-text-muted ml-1.5 text-xs font-normal">({users.length})</span>
      </h2>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {users.map((user) => (
          <ReadyUserCard
            key={user.id}
            user={user}
            onCall={(userId) => initiateCall.mutate(userId)}
            isLoading={initiateCall.isPending}
          />
        ))}
      </div>
    </section>
  )
}
