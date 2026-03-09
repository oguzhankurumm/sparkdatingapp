'use client'

import { useCallback, useRef, useEffect } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Skeleton } from '@spark/ui'
import { useBrowseTables } from '../hooks'
import { TableCard } from './table-card'

export function BrowseTablesSection() {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useBrowseTables()

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite scroll via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0]
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '200px',
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleObserver])

  const allTables = data?.pages.flatMap((page) => page.items) ?? []
  const isEmpty = !isLoading && allTables.length === 0

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-text-primary px-4 text-lg font-bold">Browse Tables</h2>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center gap-2 px-4 py-12">
          <div className="bg-surface-elevated flex h-14 w-14 items-center justify-center rounded-full">
            <MagnifyingGlass size={24} className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">No tables nearby right now</p>
          <p className="text-text-muted text-xs">Be the first to host one!</p>
        </div>
      )}

      {/* Table list */}
      {!isLoading && allTables.length > 0 && (
        <div className="space-y-3 px-4">
          {allTables.map((table) => (
            <TableCard key={table.id} table={table} />
          ))}
        </div>
      )}

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <div className="space-y-3 px-4">
          <Skeleton variant="card" className="h-32 rounded-2xl" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
    </section>
  )
}
