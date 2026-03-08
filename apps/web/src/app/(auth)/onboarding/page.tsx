'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check } from '@phosphor-icons/react'
import { Button, GradientText } from '@spark/ui'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { api } from '@/lib/api-client'

import { StepBasicInfo } from './steps/step-basic-info'
import { StepPhotos } from './steps/step-photos'
import { StepBioPrompts } from './steps/step-bio-prompts'
import { StepLocation } from './steps/step-location'
import { StepInterests } from './steps/step-interests'
import { StepRelationshipGoals } from './steps/step-relationship-goals'
import { StepDiscoveryPreferences } from './steps/step-discovery-preferences'
import { StepNotifications } from './steps/step-notifications'
import { StepPhotoVerify } from './steps/step-photo-verify'

const TOTAL_STEPS = 9
const SKIPPABLE_STEPS = [8, 9]

const STEP_TITLES: Record<number, string> = {
  1: 'About You',
  2: 'Your Photos',
  3: 'Your Story',
  4: 'Your Location',
  5: 'Your Interests',
  6: 'Looking For',
  7: 'Preferences',
  8: 'Notifications',
  9: 'Get Verified',
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const { currentStep, data, updateData, nextStep, prevStep, reset } = useOnboardingStore()
  const [direction, setDirection] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stepValid, setStepValid] = useState(false)

  const isSkippable = SKIPPABLE_STEPS.includes(currentStep)
  const isLastStep = currentStep === TOTAL_STEPS
  const isFirstStep = currentStep === 1

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      await handleSubmit()
      return
    }
    setDirection(1)
    nextStep()
  }, [isLastStep, nextStep])

  const handleBack = useCallback(() => {
    setDirection(-1)
    prevStep()
  }, [prevStep])

  const handleSkip = useCallback(async () => {
    if (isLastStep) {
      await handleSubmit()
      return
    }
    setDirection(1)
    nextStep()
  }, [isLastStep, nextStep])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await api.patch('/users/onboarding', data)
      reset()
      router.push('/discover')
    } catch {
      // Error is handled by api-client (401 redirect etc.)
      // For other errors, we just stop loading
    } finally {
      setIsSubmitting(false)
    }
  }, [data, reset, router])

  const progressPercent = (currentStep / TOTAL_STEPS) * 100

  const stepComponent = useMemo(() => {
    const props = { data, updateData, onValidChange: setStepValid }
    switch (currentStep) {
      case 1:
        return <StepBasicInfo {...props} />
      case 2:
        return <StepPhotos {...props} />
      case 3:
        return <StepBioPrompts {...props} />
      case 4:
        return <StepLocation {...props} />
      case 5:
        return <StepInterests {...props} />
      case 6:
        return <StepRelationshipGoals {...props} />
      case 7:
        return <StepDiscoveryPreferences {...props} />
      case 8:
        return <StepNotifications {...props} />
      case 9:
        return <StepPhotoVerify {...props} />
      default:
        return null
    }
  }, [currentStep, data, updateData])

  return (
    <main className="bg-background flex min-h-dvh flex-col">
      {/* Header */}
      <header className="bg-background/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          {/* Back button */}
          <div className="w-10">
            {!isFirstStep ? (
              <button
                onClick={handleBack}
                className="text-text-secondary hover:bg-surface-elevated hover:text-text-primary flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={22} weight="bold" />
              </button>
            ) : null}
          </div>

          {/* Step indicator */}
          <div className="flex flex-col items-center">
            <span className="text-text-muted text-xs font-medium">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <GradientText className="text-sm font-bold">{STEP_TITLES[currentStep]}</GradientText>
          </div>

          {/* Skip button */}
          <div className="w-10">
            {isSkippable ? (
              <button
                onClick={handleSkip}
                className="text-text-muted hover:text-text-primary text-sm font-medium transition-colors"
              >
                Skip
              </button>
            ) : null}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-border h-1 w-full">
          <motion.div
            className="h-full bg-[image:var(--gradient-brand)]"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </header>

      {/* Step content */}
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden px-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-1 flex-col py-6"
          >
            {stepComponent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="border-border bg-background/80 sticky bottom-0 border-t backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          {isSkippable ? (
            <Button variant="ghost" size="lg" onClick={handleSkip} className="flex-1">
              Maybe Later
            </Button>
          ) : null}

          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!isSkippable && !stepValid}
            loading={isSubmitting}
            className={isSkippable ? 'flex-1' : 'w-full'}
          >
            {isLastStep ? (
              <>
                <Check size={18} weight="bold" />
                Complete Setup
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
