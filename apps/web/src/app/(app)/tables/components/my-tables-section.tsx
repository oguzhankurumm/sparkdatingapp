'use client'

import Link from 'next/link'
import { CalendarDots, Users, Crown, Clock } from '@phosphor-icons/react'
import { Badge, Skeleton } from '@spark/ui'
import { useMyTables } from '../hooks'
import type { MyTable } from '@spark/types'

function MyTableRow({ table, role }: { table: MyTable; role: 'host' | 'guest' }) {
  const scheduledDate = new Date(table.scheduledAt)
  const timeLabel = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const dateLabel = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/tables/${table.id}` as never}
      className="bg-surface flex items-center gap-3 rounded-xl px-4 py-3 transition-transform active:scale-[0.98]"
    >
      {/* Icon */}
      <div className="bg-surface-elevated flex h-10 w-10 items-center justify-center rounded-full">
        {role === 'host' ? (
          <Crown size={18} weight="fill" className="text-boost" />
        ) : (
          <Users size={18} weight="fill" className="text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="text-text-primary truncate text-sm font-semibold">{table.title}</h4>
          {table.isVip && (
            <Badge variant="boost" size="sm">
              VIP
            </Badge>
          )}
        </div>
        <div className="text-text-muted flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5">
            <CalendarDots size={12} />
            {dateLabel}, {timeLabel}
          </span>
          <span className="flex items-center gap-0.5">
            <Users size={12} />
            {table.guestCount}/{table.maxGuests}
          </span>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1.5">
        {table.pendingCount > 0 && role === 'host' && (
          <Badge variant="new" size="sm">
            <Clock size={10} />
            {table.pendingCount} pending
          </Badge>
        )}
        <Badge variant={table.status === 'active' ? 'online' : 'default'} size="sm">
          {table.status}
        </Badge>
      </div>
    </Link>
  )
}

export function MyTablesSection() {
  const { data, isLoading } = useMyTables()

  const hasHosted = data?.hosted && data.hosted.length > 0
  const hasJoined = data?.joined && data.joined.length > 0
  const isEmpty = !isLoading && !hasHosted && !hasJoined

  if (isEmpty) return null

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-text-primary px-4 text-lg font-bold">My Tables</h2>

      {isLoading ? (
        <div className="space-y-2 px-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 px-4">
          {/* Hosted */}
          {hasHosted && (
            <div className="space-y-2">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
                Hosting
              </p>
              {data.hosted.map((table) => (
                <MyTableRow key={table.id} table={table} role="host" />
              ))}
            </div>
          )}

          {/* Joined */}
          {hasJoined && (
            <div className="space-y-2">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Joined</p>
              {data.joined.map((table) => (
                <MyTableRow key={table.id} table={table} role="guest" />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
