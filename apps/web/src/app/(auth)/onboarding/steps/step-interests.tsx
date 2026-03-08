'use client'

import { useEffect } from 'react'
import {
  Basketball,
  MusicNote,
  ForkKnife,
  AirplaneTilt,
  PaintBrush,
  GameController,
  FilmSlate,
  BookOpen,
  Barbell,
  Desktop,
  Tree,
  CameraRotate,
  CookingPot,
  PersonSimpleTaiChi,
  TShirt,
  Flower,
  Coffee,
  PawPrint,
} from '@phosphor-icons/react'
import { PillTag, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepInterestsProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const MIN_INTERESTS = 3

const INTEREST_OPTIONS = [
  { id: 'sports', label: 'Sports', icon: Basketball },
  { id: 'music', label: 'Music', icon: MusicNote },
  { id: 'food', label: 'Food', icon: ForkKnife },
  { id: 'travel', label: 'Travel', icon: AirplaneTilt },
  { id: 'art', label: 'Art', icon: PaintBrush },
  { id: 'gaming', label: 'Gaming', icon: GameController },
  { id: 'movies', label: 'Movies', icon: FilmSlate },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'fitness', label: 'Fitness', icon: Barbell },
  { id: 'technology', label: 'Technology', icon: Desktop },
  { id: 'nature', label: 'Nature', icon: Tree },
  { id: 'photography', label: 'Photography', icon: CameraRotate },
  { id: 'cooking', label: 'Cooking', icon: CookingPot },
  { id: 'dancing', label: 'Dancing', icon: PersonSimpleTaiChi },
  { id: 'fashion', label: 'Fashion', icon: TShirt },
  { id: 'yoga', label: 'Yoga', icon: Flower },
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'pets', label: 'Pets', icon: PawPrint },
] as const

export function StepInterests({ data, updateData, onValidChange }: StepInterestsProps) {
  const interests = data.interests ?? []

  useEffect(() => {
    onValidChange(interests.length >= MIN_INTERESTS)
  }, [interests, onValidChange])

  const handleToggleInterest = (interestId: string) => {
    if (interests.includes(interestId)) {
      updateData({ interests: interests.filter((i) => i !== interestId) })
    } else {
      updateData({ interests: [...interests, interestId] })
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">What are you into?</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Pick at least {MIN_INTERESTS} interests.{' '}
          <span
            className={cn(
              'font-medium',
              interests.length >= MIN_INTERESTS ? 'text-success' : 'text-primary',
            )}
          >
            {interests.length} selected
          </span>
        </p>
      </div>

      {/* Interests grid */}
      <div className="flex flex-wrap gap-2.5">
        {INTEREST_OPTIONS.map((interest) => {
          const Icon = interest.icon
          const isSelected = interests.includes(interest.id)

          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => handleToggleInterest(interest.id)}
              className="focus:outline-none"
            >
              <PillTag
                variant={isSelected ? 'selected' : 'default'}
                size="lg"
                icon={
                  <Icon
                    size={16}
                    weight={isSelected ? 'fill' : 'regular'}
                    className={cn(isSelected ? 'text-white' : 'text-text-muted')}
                  />
                }
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  isSelected
                    ? 'scale-105 bg-[image:var(--gradient-brand)] text-white shadow-md'
                    : 'hover:border-primary/30 hover:text-primary',
                )}
              >
                {interest.label}
              </PillTag>
            </button>
          )
        })}
      </div>

      {/* Status */}
      {interests.length > 0 && interests.length < MIN_INTERESTS ? (
        <p className="text-text-muted text-center text-sm">
          Pick {MIN_INTERESTS - interests.length} more to continue
        </p>
      ) : null}
    </div>
  )
}
