'use client'

import { useRouter } from 'next/navigation'
import { StoryCircle } from '@spark/ui'
import type { Match } from '../types'

interface NewMatchesRowProps {
  matches: Match[]
}

export function NewMatchesRow({ matches }: NewMatchesRowProps) {
  const router = useRouter()

  if (matches.length === 0) return null

  return (
    <section className="border-border-subtle border-b pb-4">
      <h3 className="text-text-secondary mb-3 px-4 text-sm font-semibold">New Matches</h3>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4">
        {matches.map((match) => (
          <StoryCircle
            key={match.id}
            src={match.partner.avatarUrl ?? undefined}
            username={match.partner.firstName}
            onClick={() => router.push(`/matches/${match.id}` as Parameters<typeof router.push>[0])}
          />
        ))}
      </div>
    </section>
  )
}
