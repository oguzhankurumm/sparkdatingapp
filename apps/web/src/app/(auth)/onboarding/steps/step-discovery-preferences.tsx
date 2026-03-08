'use client'

import { useEffect } from 'react'
import { GenderMale, GenderFemale, Users } from '@phosphor-icons/react'
import { Slider, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepDiscoveryPreferencesProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const SHOW_ME_OPTIONS = [
  { value: 'men' as const, label: 'Men', icon: GenderMale },
  { value: 'women' as const, label: 'Women', icon: GenderFemale },
  { value: 'everyone' as const, label: 'Everyone', icon: Users },
]

const DEFAULT_AGE_MIN = 18
const DEFAULT_AGE_MAX = 35
const DEFAULT_DISTANCE = 50

export function StepDiscoveryPreferences({
  data,
  updateData,
  onValidChange,
}: StepDiscoveryPreferencesProps) {
  const showMe = data.showMe
  const ageMin = data.ageRangeMin ?? DEFAULT_AGE_MIN
  const ageMax = data.ageRangeMax ?? DEFAULT_AGE_MAX
  const distance = data.maxDistanceKm ?? DEFAULT_DISTANCE

  useEffect(() => {
    onValidChange(!!showMe)
  }, [showMe, onValidChange])

  // Initialize defaults if not set
  useEffect(() => {
    if (data.ageRangeMin === undefined) {
      updateData({ ageRangeMin: DEFAULT_AGE_MIN })
    }
    if (data.ageRangeMax === undefined) {
      updateData({ ageRangeMax: DEFAULT_AGE_MAX })
    }
    if (data.maxDistanceKm === undefined) {
      updateData({ maxDistanceKm: DEFAULT_DISTANCE })
    }
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-8">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Your preferences</h2>
        <p className="text-text-secondary mt-1 text-sm">Customize who you see in discovery</p>
      </div>

      {/* Show Me */}
      <div className="space-y-3">
        <label className="text-text-primary text-sm font-medium">
          Show Me<span className="text-danger ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {SHOW_ME_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = showMe === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateData({ showMe: option.value })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary-light shadow-md'
                    : 'border-border bg-surface-elevated hover:border-primary/30',
                )}
              >
                <Icon
                  size={28}
                  weight={isSelected ? 'fill' : 'regular'}
                  className={cn(
                    'transition-colors',
                    isSelected ? 'text-primary' : 'text-text-muted',
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-primary' : 'text-text-secondary',
                  )}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-text-primary text-sm font-medium">Age Range</label>
          <span className="text-primary text-sm font-semibold">
            {ageMin} - {ageMax >= 50 ? '50+' : ageMax}
          </span>
        </div>

        <div className="space-y-3">
          <Slider
            label="Minimum age"
            value={ageMin}
            min={18}
            max={50}
            onChange={(val) => {
              const newMin = Math.min(val, ageMax - 1)
              updateData({ ageRangeMin: newMin })
            }}
            showValue
            formatValue={(v) => `${v}`}
          />
          <Slider
            label="Maximum age"
            value={ageMax}
            min={18}
            max={50}
            onChange={(val) => {
              const newMax = Math.max(val, ageMin + 1)
              updateData({ ageRangeMax: newMax })
            }}
            showValue
            formatValue={(v) => (v >= 50 ? '50+' : `${v}`)}
          />
        </div>
      </div>

      {/* Distance */}
      <Slider
        label="Maximum Distance"
        value={distance}
        min={1}
        max={200}
        onChange={(val) => updateData({ maxDistanceKm: val })}
        showValue
        formatValue={(v) => (v >= 200 ? '200+ km' : `${v} km`)}
      />
    </div>
  )
}
