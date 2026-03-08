'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowClockwise, HeartBreak } from '@phosphor-icons/react'
import { Button, Skeleton } from '@spark/ui'
import { useMatches } from './hooks'
import { NewMatchesRow } from './components/new-matches-row'
import { MatchListItem } from './components/match-list-item'

export default function MatchesPage() {
  const router = useRouter()
  const { data, isLoading, isError, refetch, isRefetching } = useMatches()

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h1 className="font-heading text-text-primary text-xl font-bold">Matches</h1>
        </div>

        {/* New Matches skeleton */}
        <section className="border-border-subtle border-b pb-4">
          <Skeleton variant="text" className="mx-4 mb-3 h-4 w-28" />
          <div className="flex gap-3 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <Skeleton variant="avatar" size="lg" />
                <Skeleton variant="text" className="h-3 w-12" />
              </div>
            ))}
          </div>
        </section>

        {/* Conversations skeleton */}
        <div className="px-1 pt-4">
          <Skeleton variant="text" className="mx-3 mb-3 h-4 w-24" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Skeleton variant="avatar" size="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" className="h-4 w-32" />
                <Skeleton variant="line" className="w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <HeartBreak size={48} className="text-text-muted mb-4" />
        <h2 className="text-text-primary text-lg font-semibold">Something went wrong</h2>
        <p className="text-text-muted mt-1 text-sm">
          We could not load your matches. Please try again.
        </p>
        <Button variant="secondary" size="sm" onClick={handleRefresh} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  const newMatches = data?.newMatches ?? []
  const conversations = data?.matches ?? []
  const hasAnyMatches = newMatches.length > 0 || conversations.length > 0

  // ── Empty State ──
  if (!hasAnyMatches) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="bg-primary-light mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <HeartBreak size={40} className="text-primary" />
        </div>
        <h2 className="text-text-primary text-lg font-semibold">No matches yet</h2>
        <p className="text-text-muted mt-1 max-w-xs text-sm">
          Keep swiping to find your spark! Great connections are just around the corner.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/discover')}
          className="mt-6"
        >
          Start Discovering
        </Button>
      </div>
    )
  }

  // ── Main Content ──
  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="font-heading text-text-primary text-xl font-bold">Matches</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefetching}
          className="text-text-muted hover:bg-surface hover:text-text-secondary rounded-full p-2 transition-colors disabled:opacity-50"
          aria-label="Refresh matches"
        >
          <ArrowClockwise size={20} className={isRefetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* New Matches — horizontal scroll */}
      <NewMatchesRow matches={newMatches} />

      {/* Messages — conversation list */}
      <section className="pt-4">
        <h3 className="text-text-secondary mb-2 px-4 text-sm font-semibold">Messages</h3>
        {conversations.length === 0 ? (
          <p className="text-text-muted px-4 py-8 text-center text-sm">
            No conversations yet. Say hello to a new match!
          </p>
        ) : (
          <div className="flex flex-col px-1">
            {conversations.map((match) => (
              <MatchListItem key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
