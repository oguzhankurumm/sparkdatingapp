'use client'

import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneX,
  PhoneSlash,
  Clock,
  CurrencyCircleDollar,
} from '@phosphor-icons/react'
import { Avatar } from '@spark/ui'
import type { CallHistoryItem } from '@spark/types'

interface CallCardProps {
  call: CallHistoryItem
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getStatusIcon(status: string, direction: 'outgoing' | 'incoming') {
  switch (status) {
    case 'completed':
      return direction === 'outgoing' ? (
        <PhoneOutgoing size={16} weight="bold" className="text-like" />
      ) : (
        <PhoneIncoming size={16} weight="bold" className="text-like" />
      )
    case 'missed':
      return <PhoneX size={16} weight="bold" className="text-pass" />
    case 'declined':
      return <PhoneSlash size={16} weight="bold" className="text-text-muted" />
    default:
      return direction === 'outgoing' ? (
        <PhoneOutgoing size={16} weight="bold" className="text-text-muted" />
      ) : (
        <PhoneIncoming size={16} weight="bold" className="text-text-muted" />
      )
  }
}

export function CallCard({ call }: CallCardProps) {
  return (
    <div className="bg-surface flex items-center gap-3 rounded-2xl p-4 shadow-sm">
      {/* Avatar */}
      <Avatar src={call.partnerAvatarUrl ?? undefined} alt={call.partnerFirstName} size="md" />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {getStatusIcon(call.status, call.direction)}
          <span className="text-text-primary truncate text-[15px] font-semibold">
            {call.partnerFirstName}
          </span>
        </div>
        <div className="text-text-muted mt-0.5 flex items-center gap-3 text-xs">
          <span>{formatTimeAgo(call.createdAt)}</span>
          {call.durationSeconds > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} weight="bold" />
              {formatDuration(call.durationSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Tokens charged */}
      {call.totalTokensCharged > 0 && (
        <div className="text-text-muted flex flex-shrink-0 items-center gap-1 text-xs">
          <CurrencyCircleDollar size={14} weight="bold" />
          <span>{call.totalTokensCharged}t</span>
        </div>
      )}
    </div>
  )
}
