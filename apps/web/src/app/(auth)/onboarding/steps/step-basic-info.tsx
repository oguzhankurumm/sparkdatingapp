'use client'

import { useEffect, useState } from 'react'
import { GenderMale, GenderFemale, GenderNonbinary } from '@phosphor-icons/react'
import { FormField, Input, Toggle, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepBasicInfoProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const GENDER_OPTIONS = [
  { value: 'male' as const, label: 'Man', icon: GenderMale },
  { value: 'female' as const, label: 'Woman', icon: GenderFemale },
  { value: 'non_binary' as const, label: 'Non-binary', icon: GenderNonbinary },
]

function getAge(birthday: string): number {
  const today = new Date()
  const birth = new Date(birthday)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function StepBasicInfo({ data, updateData, onValidChange }: StepBasicInfoProps) {
  const [showGender, setShowGender] = useState(true)
  const [birthdayError, setBirthdayError] = useState<string | undefined>()

  const firstName = data.firstName ?? ''
  const birthday = data.birthday ?? ''
  const gender = data.gender

  useEffect(() => {
    const hasName = firstName.trim().length >= 2
    const hasBirthday = birthday.length > 0
    const isOldEnough = hasBirthday && getAge(birthday) >= 18
    const hasGender = !!gender

    if (hasBirthday && !isOldEnough) {
      setBirthdayError('You must be at least 18 years old')
    } else {
      setBirthdayError(undefined)
    }

    onValidChange(hasName && hasBirthday && isOldEnough && hasGender)
  }, [firstName, birthday, gender, onValidChange])

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">
          Let&apos;s get started
        </h2>
        <p className="text-text-secondary mt-1 text-sm">Tell us a bit about yourself</p>
      </div>

      {/* First name */}
      <FormField
        label="First Name"
        required
        error={
          firstName.length > 0 && firstName.trim().length < 2
            ? 'Name must be at least 2 characters'
            : undefined
        }
      >
        <Input
          placeholder="Your first name"
          value={firstName}
          onChange={(e) => updateData({ firstName: e.target.value })}
          error={firstName.length > 0 && firstName.trim().length < 2}
          maxLength={50}
        />
      </FormField>

      {/* Birthday */}
      <FormField
        label="Birthday"
        required
        error={birthdayError}
        helperText={!birthdayError ? 'You must be 18+ to use Spark' : undefined}
      >
        <Input
          type="date"
          value={birthday}
          onChange={(e) => updateData({ birthday: e.target.value })}
          error={!!birthdayError}
          max={
            new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())
              .toISOString()
              .split('T')[0]
          }
        />
      </FormField>

      {/* Gender */}
      <div className="space-y-2">
        <label className="text-text-primary text-sm font-medium">
          I am a<span className="text-danger ml-0.5">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {GENDER_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = gender === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateData({ gender: option.value })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary-light shadow-md'
                    : 'border-border bg-surface-elevated hover:border-primary/30',
                )}
              >
                <Icon
                  size={32}
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

      {/* Show gender toggle */}
      <div className="bg-surface-elevated flex items-center justify-between rounded-xl p-4">
        <span className="text-text-secondary text-sm">Show my gender on profile</span>
        <Toggle checked={showGender} onChange={(checked) => setShowGender(checked)} size="sm" />
      </div>
    </div>
  )
}
