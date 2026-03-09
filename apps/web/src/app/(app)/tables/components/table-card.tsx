'use client'

import Link from 'next/link'
import { CalendarDots, MapPin, Users, SealCheck, Crown } from '@phosphor-icons/react'
import { Avatar, Badge } from '@spark/ui'
import type { TableListing } from '@spark/types'

interface TableCardProps {
  table: TableListing
}

export function TableCard({ table }: TableCardProps) {
  const scheduledDate = new Date(table.scheduledAt)
  const now = new Date()
  const isToday = scheduledDate.toDateString() === now.toDateString()
  const isTomorrow =
    scheduledDate.toDateString() === new Date(now.getTime() + 86400000).toDateString()

  const dateLabel = isToday
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : scheduledDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })

  const timeLabel = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const location = table.venueName || table.customLocation || 'Location TBD'

  return (
    <Link
      href={`/tables/${table.id}` as never}
      className="bg-surface block overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* Host avatar */}
        <Avatar
          src={table.hostAvatarUrl ?? undefined}
          alt={table.hostFirstName ?? 'Host'}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-text-primary truncate text-[15px] font-semibold">{table.title}</h3>
            {table.hostIsVerified && (
              <SealCheck size={14} weight="fill" className="text-super-like flex-shrink-0" />
            )}
          </div>
          <p className="text-text-secondary text-xs">
            Hosted by {table.hostFirstName ?? 'Unknown'}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {table.isVip && (
            <Badge variant="boost" size="sm">
              <Crown size={10} weight="fill" />
              VIP
            </Badge>
          )}
          {table.tokenCostToJoin > 0 && (
            <Badge variant="default" size="sm">
              {table.tokenCostToJoin}t
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {table.description && (
        <p className="text-text-secondary line-clamp-2 px-4 text-sm">{table.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 px-4 pb-4 pt-3">
        <div className="text-text-muted flex items-center gap-1 text-xs">
          <CalendarDots size={14} weight="bold" />
          <span>
            {dateLabel}, {timeLabel}
          </span>
        </div>
        <div className="text-text-muted flex items-center gap-1 text-xs">
          <MapPin size={14} weight="bold" />
          <span className="max-w-[120px] truncate">{location}</span>
        </div>
        <div className="text-text-muted ml-auto flex items-center gap-1 text-xs">
          <Users size={14} weight="bold" />
          <span>{table.maxGuests} spots</span>
        </div>
      </div>
    </Link>
  )
}
