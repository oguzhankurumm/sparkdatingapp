'use client'

import { useEffect } from 'react'
import { Heart, SunHorizon, UsersThree, Question } from '@phosphor-icons/react'
import { cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepRelationshipGoalsProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const GOAL_OPTIONS = [
  {
    value: 'long_term' as const,
    label: 'Long-term',
    description: 'Looking for something serious',
    icon: Heart,
    color: 'text-like',
    bgColor: 'bg-like/10',
    borderColor: 'border-like/30',
    selectedBg: 'bg-like/15',
  },
  {
    value: 'short_term' as const,
    label: 'Short-term',
    description: 'Keeping it casual',
    icon: SunHorizon,
    color: 'text-boost',
    bgColor: 'bg-boost/10',
    borderColor: 'border-boost/30',
    selectedBg: 'bg-boost/15',
  },
  {
    value: 'friends' as const,
    label: 'Friends',
    description: 'Making new friends',
    icon: UsersThree,
    color: 'text-super-like',
    bgColor: 'bg-super-like/10',
    borderColor: 'border-super-like/30',
    selectedBg: 'bg-super-like/15',
  },
  {
    value: 'unsure' as const,
    label: 'Not sure yet',
    description: 'Figuring it out',
    icon: Question,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
    selectedBg: 'bg-secondary/15',
  },
]

export function StepRelationshipGoals({
  data,
  updateData,
  onValidChange,
}: StepRelationshipGoalsProps) {
  const goal = data.relationshipGoal

  useEffect(() => {
    onValidChange(!!goal)
  }, [goal, onValidChange])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">
          What are you looking for?
        </h2>
        <p className="text-text-secondary mt-1 text-sm">
          This helps us find the right matches for you
        </p>
      </div>

      {/* Goal cards */}
      <div className="flex flex-col gap-3">
        {GOAL_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = goal === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateData({ relationshipGoal: option.value })}
              className={cn(
                'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200',
                isSelected
                  ? `${option.borderColor} ${option.selectedBg} shadow-md`
                  : 'border-border bg-surface-elevated hover:border-primary/20',
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isSelected ? option.bgColor : 'bg-surface',
                )}
              >
                <Icon
                  size={28}
                  weight={isSelected ? 'fill' : 'regular'}
                  className={cn('transition-colors', isSelected ? option.color : 'text-text-muted')}
                />
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    'font-semibold transition-colors',
                    isSelected ? 'text-text-primary' : 'text-text-primary',
                  )}
                >
                  {option.label}
                </p>
                <p className="text-text-secondary mt-0.5 text-sm">{option.description}</p>
              </div>

              {/* Selection indicator */}
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  isSelected ? 'border-primary bg-primary' : 'border-border',
                )}
              >
                {isSelected ? <div className="h-2 w-2 rounded-full bg-white" /> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
