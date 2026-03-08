'use client'

import { CaretRight, Users } from '@phosphor-icons/react'
import { Badge } from '@spark/ui'

interface TableItem {
  id: string
  title: string
  photo: string
  spotsRemaining: number
  totalSpots: number
  isVip: boolean
}

// Placeholder data while the tables endpoint is being built
const PLACEHOLDER_TABLES: TableItem[] = [
  {
    id: '1',
    title: 'Coffee & Conversation',
    photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    spotsRemaining: 3,
    totalSpots: 6,
    isVip: false,
  },
  {
    id: '2',
    title: 'VIP Wine Night',
    photo: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    spotsRemaining: 1,
    totalSpots: 4,
    isVip: true,
  },
  {
    id: '3',
    title: 'Weekend Brunch',
    photo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    spotsRemaining: 5,
    totalSpots: 8,
    isVip: false,
  },
]

export function NearbyTablesRow() {
  const tables = PLACEHOLDER_TABLES

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="font-heading text-text-primary text-lg font-bold">Nearby Tables</h2>
        <a href="/tables" className="text-primary flex items-center gap-0.5 text-sm font-medium">
          See all
          <CaretRight size={14} weight="bold" />
        </a>
      </div>

      {/* Horizontal scroll */}
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4">
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            className="bg-surface w-52 flex-shrink-0 overflow-hidden rounded-xl shadow-sm transition-transform active:scale-[0.98]"
          >
            {/* Photo */}
            <div className="relative aspect-[16/10]">
              <img src={table.photo} alt={table.title} className="h-full w-full object-cover" />
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
              <h3 className="text-text-primary truncate text-sm font-semibold">{table.title}</h3>
              <div className="text-text-muted mt-1 flex items-center gap-1 text-xs">
                <Users size={12} weight="bold" />
                <span>
                  {table.spotsRemaining}/{table.totalSpots} spots left
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
