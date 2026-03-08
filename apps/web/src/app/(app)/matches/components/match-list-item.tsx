'use client'

import { useRouter } from 'next/navigation'
import { ConversationRow } from '@spark/ui'
import type { Match } from '../types'
import { formatRelativeTime, isUserOnline } from '../utils'

interface MatchListItemProps {
  match: Match
}

export function MatchListItem({ match }: MatchListItemProps) {
  const router = useRouter()

  return (
    <ConversationRow
      name={match.partner.firstName}
      avatar={match.partner.avatarUrl ?? undefined}
      lastMessage={match.lastMessage ?? 'Say hello!'}
      timestamp={
        match.lastMessageAt
          ? formatRelativeTime(match.lastMessageAt)
          : formatRelativeTime(match.matchedAt)
      }
      unreadCount={match.unreadCount}
      online={isUserOnline(match.partner.lastActiveAt)}
      verified={match.partner.isVerified}
      onClick={() => router.push(`/matches/${match.id}` as Parameters<typeof router.push>[0])}
    />
  )
}
