'use client'

import { ClockCounterClockwise } from '@phosphor-icons/react'
import { Skeleton } from '@spark/ui'
import { useCallHistory } from '../hooks'
import { CallCard } from './call-card'

export function CallHistorySection() {
  const { data, isLoading } = useCallHistory()

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-text-primary px-1 text-base font-semibold">Recent Calls</h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl p-4">
              <Skeleton variant="avatar" className="h-10 w-10" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const calls = data?.calls ?? []

  if (calls.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-text-primary px-1 text-base font-semibold">Recent Calls</h2>
        <div className="bg-surface flex flex-col items-center gap-2 rounded-2xl py-10">
          <ClockCounterClockwise size={32} weight="light" className="text-text-muted" />
          <p className="text-text-muted text-sm">No call history yet</p>
          <p className="text-text-muted text-xs">Start a call with someone above!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-text-primary px-1 text-base font-semibold">
        Recent Calls
        <span className="text-text-muted ml-1.5 text-xs font-normal">({data?.total ?? 0})</span>
      </h2>
      <div className="space-y-2">
        {calls.map((call) => (
          <CallCard key={call.id} call={call} />
        ))}
      </div>
    </section>
  )
}
