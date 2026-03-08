'use client'

import { useEffect, useState } from 'react'
import { Camera, ShieldCheck, SealCheck, CheckCircle } from '@phosphor-icons/react'
import { Button, cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepPhotoVerifyProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const VERIFICATION_BENEFITS = [
  'Get a verified badge on your profile',
  'Increase your trust score',
  'Get more matches',
]

export function StepPhotoVerify({ data, updateData, onValidChange }: StepPhotoVerifyProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const isVerified = !!data.verificationPhotoUrl

  // This step is optional — always valid
  useEffect(() => {
    onValidChange(true)
  }, [onValidChange])

  const handleTakeSelfie = async () => {
    setIsCapturing(true)

    // Simulate a selfie capture — in the real app this would use the camera API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    updateData({ verificationPhotoUrl: '/placeholders/selfie-verify.jpg' })
    setIsCapturing(false)
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6 pt-4">
      {/* Shield icon */}
      <div
        className={cn(
          'flex h-28 w-28 items-center justify-center rounded-full transition-all duration-300',
          isVerified ? 'bg-success/10' : 'bg-primary-light',
        )}
      >
        {isVerified ? (
          <SealCheck size={56} weight="fill" className="text-success" />
        ) : (
          <ShieldCheck size={56} weight="fill" className="text-primary" />
        )}
      </div>

      {/* Heading */}
      <div className="text-center">
        <h2 className="font-heading text-text-primary text-2xl font-bold">
          {isVerified ? 'Verified!' : 'Get verified'}
        </h2>
        <p className="text-text-secondary mt-2 text-sm">
          {isVerified
            ? "Your verification photo has been submitted. You'll get your badge soon!"
            : "Take a selfie to prove you're real and earn a verified badge."}
        </p>
      </div>

      {/* Benefits */}
      {!isVerified ? (
        <div className="w-full space-y-2.5">
          {VERIFICATION_BENEFITS.map((benefit) => (
            <div
              key={benefit}
              className="bg-surface-elevated flex items-center gap-3 rounded-xl px-4 py-3"
            >
              <CheckCircle size={20} weight="fill" className="text-primary shrink-0" />
              <p className="text-text-primary text-sm">{benefit}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Action button */}
      {!isVerified ? (
        <Button
          variant="primary"
          size="lg"
          onClick={handleTakeSelfie}
          loading={isCapturing}
          className="mt-2 w-full"
        >
          <Camera size={18} weight="bold" />
          Take a Selfie
        </Button>
      ) : (
        <div className="bg-success/10 mt-2 w-full rounded-xl px-6 py-4 text-center">
          <p className="text-success text-sm font-semibold">Selfie submitted for verification</p>
          <p className="text-text-muted mt-1 text-xs">This usually takes a few minutes</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-surface-elevated rounded-xl p-4">
        <p className="text-text-muted text-center text-xs">
          Your selfie will be compared to your profile photos to verify your identity. It won&apos;t
          be shown on your profile.
        </p>
      </div>
    </div>
  )
}
