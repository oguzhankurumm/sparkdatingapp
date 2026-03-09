'use client'

import Link from 'next/link'
import { CaretRight, Users } from '@phosphor-icons/react'
import { Badge, Skeleton } from '@spark/ui'
import { useNearbyTables } from '../hooks'

export function NearbyTablesRow() {
  const { data, isLoading } = useNearbyTables()

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-heading text-text-primary text-lg font-bold">Nearby Tables</h2>
        <Link href="/tables" className="text-primary flex items-center gap-0.5 text-sm font-medium">
          See all
          <CaretRight size={14} weight="bold" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-52 flex-shrink-0 overflow-hidden rounded-xl">
                <Skeleton variant="card" className="aspect-[16/10]" />
                <div className="space-y-2 p-3">
                  <Skeleton variant="text" className="h-4 w-32" />
                  <Skeleton variant="text" className="h-3 w-20" />
                </div>
              </div>
            ))
          : data?.tables.map((table) => (
              <Link
                key={table.id}
                href={`/tables/${table.id}` as never}
                className="bg-surface w-52 flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition-transform active:scale-[0.98]"
              >
                {/* Photo */}
                <div className="relative aspect-[16/10]">
                  {table.imageUrl ? (
                    <img
                      src={table.imageUrl}
                      alt={table.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-surface-elevated flex h-full w-full items-center justify-center">
                      <Users size={24} className="text-text-muted" />
                    </div>
                  )}
                  {table.isVip ? (
                    <div className="absolute left-2 top-2">
                      <Badge variant="boost" size="sm">
                        VIP
                      </Badge>
                    </div>
                  ) : null}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-text-primary truncate text-sm font-semibold">
                    {table.title}
                  </h3>
                  <div className="text-text-muted mt-1 flex items-center gap-1 text-xs">
                    <Users size={12} weight="bold" />
                    <span>
                      {table.spotsRemaining}/{table.maxGuests} spots left
                    </span>
                  </div>
                </div>
              </Link>
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && (!data?.tables || data.tables.length === 0) ? (
        <p className="text-text-muted px-4 py-4 text-sm">
          No nearby tables right now. Why not host one?
        </p>
      ) : null}
    </section>
  )
}
