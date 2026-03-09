'use client'

import { SealCheck, CurrencyCircleDollar, VideoCamera } from '@phosphor-icons/react'
import { Avatar, Button } from '@spark/ui'
import type { ReadyForCallUser } from '@spark/types'

interface ReadyUserCardProps {
  user: ReadyForCallUser
  onCall: (userId: string) => void
  isLoading?: boolean
}

export function ReadyUserCard({ user, onCall, isLoading }: ReadyUserCardProps) {
  return (
    <div className="bg-surface flex w-[140px] flex-shrink-0 flex-col items-center gap-2 rounded-2xl p-4 shadow-sm">
      {/* Avatar */}
      <div className="relative">
        <Avatar src={user.avatarUrl ?? undefined} alt={user.firstName} size="lg" />
        {/* Online indicator */}
        <span className="bg-like absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white" />
      </div>

      {/* Name + verified */}
      <div className="flex items-center gap-1">
        <span className="text-text-primary max-w-[100px] truncate text-sm font-semibold">
          {user.firstName}
        </span>
        {user.isVerified && (
          <SealCheck size={14} weight="fill" className="text-super-like flex-shrink-0" />
        )}
      </div>

      {/* Rate */}
      <div className="text-text-muted flex items-center gap-1 text-xs">
        <CurrencyCircleDollar size={12} weight="bold" />
        <span>{user.callRate}t/min</span>
      </div>

      {/* Call button */}
      <Button
        size="sm"
        variant="like"
        className="mt-1 w-full gap-1"
        onClick={() => onCall(user.id)}
        disabled={isLoading}
      >
        <VideoCamera size={14} weight="fill" />
        Call
      </Button>
    </div>
  )
}
