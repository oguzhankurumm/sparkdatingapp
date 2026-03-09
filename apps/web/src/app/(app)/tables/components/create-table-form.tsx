'use client'

import { useState } from 'react'
import { CalendarDots, MapPin, Crown, Coins } from '@phosphor-icons/react'
import { Button, Input, Toggle } from '@spark/ui'
import { TOKEN_ECONOMY } from '@spark/types'
import { useCreateTable } from '../hooks'

interface CreateTableFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateTableForm({ onSuccess, onCancel }: CreateTableFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [maxGuests, setMaxGuests] = useState(5)
  const [isVip, setIsVip] = useState(false)

  const createTable = useCreateTable()

  const cost = isVip ? TOKEN_ECONOMY.VIP_TABLE_CREATE_COST : TOKEN_ECONOMY.TABLE_CREATE_COST
  const maxGuestsLimit = isVip
    ? TOKEN_ECONOMY.TABLE_MAX_GUESTS_VIP
    : TOKEN_ECONOMY.TABLE_MAX_GUESTS_NORMAL

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !scheduledAt) return

    createTable.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        venueName: venueName.trim() || undefined,
        venueAddress: venueAddress.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        maxGuests,
        isVip,
      },
      { onSuccess },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="table-title" className="text-text-primary text-sm font-medium">
          Table name *
        </label>
        <Input
          id="table-title"
          placeholder="Rooftop drinks & good vibes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor="table-desc" className="text-text-primary text-sm font-medium">
          Description
        </label>
        <textarea
          id="table-desc"
          placeholder="Tell people what to expect..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-1"
        />
      </div>

      {/* Venue */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="venue-name" className="text-text-primary text-sm font-medium">
            <MapPin size={14} weight="bold" className="mr-1 inline" />
            Venue name
          </label>
          <Input
            id="venue-name"
            placeholder="The Rooftop Bar"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="venue-address" className="text-text-primary text-sm font-medium">
            Address
          </label>
          <Input
            id="venue-address"
            placeholder="123 Main St"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
          />
        </div>
      </div>

      {/* Date & guests */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="scheduled-at" className="text-text-primary text-sm font-medium">
            <CalendarDots size={14} weight="bold" className="mr-1 inline" />
            When *
          </label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="max-guests" className="text-text-primary text-sm font-medium">
            Max guests
          </label>
          <Input
            id="max-guests"
            type="number"
            min={1}
            max={maxGuestsLimit}
            value={maxGuests}
            onChange={(e) => setMaxGuests(Number(e.target.value))}
          />
          <p className="text-text-muted text-xs">Up to {maxGuestsLimit}</p>
        </div>
      </div>

      {/* VIP toggle */}
      <div className="bg-surface-elevated flex items-center justify-between rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown size={18} weight="fill" className="text-boost" />
          <div>
            <p className="text-text-primary text-sm font-medium">VIP Table</p>
            <p className="text-text-muted text-xs">Up to 10 guests, premium badge</p>
          </div>
        </div>
        <Toggle checked={isVip} onChange={setIsVip} />
      </div>

      {/* Cost indicator */}
      <div className="bg-surface-elevated flex items-center gap-2 rounded-xl px-4 py-3">
        <Coins size={18} weight="fill" className="text-boost" />
        <p className="text-text-secondary text-sm">
          Creating costs <span className="text-text-primary font-semibold">{cost} tokens</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="pass" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="like"
          className="flex-1"
          disabled={!title.trim() || !scheduledAt || createTable.isPending}
        >
          {createTable.isPending ? 'Creating...' : `Create Table (${cost}t)`}
        </Button>
      </div>

      {/* Error */}
      {createTable.isError && (
        <p className="text-like text-center text-sm">
          {createTable.error?.message || 'Failed to create table'}
        </p>
      )}
    </form>
  )
}
