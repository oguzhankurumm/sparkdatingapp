'use client'

import { useEffect } from 'react'
import { Camera, Plus, Star, X } from '@phosphor-icons/react'
import { cn } from '@spark/ui'
import type { OnboardingData } from '@/lib/stores/onboarding-store'

interface StepPhotosProps {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  onValidChange: (valid: boolean) => void
}

const MAX_PHOTOS = 6
const MIN_PHOTOS = 2

const PLACEHOLDER_URLS = [
  '/placeholders/photo-1.jpg',
  '/placeholders/photo-2.jpg',
  '/placeholders/photo-3.jpg',
  '/placeholders/photo-4.jpg',
  '/placeholders/photo-5.jpg',
  '/placeholders/photo-6.jpg',
]

export function StepPhotos({ data, updateData, onValidChange }: StepPhotosProps) {
  const photos = data.photos ?? []
  const photoCount = photos.length

  useEffect(() => {
    onValidChange(photoCount >= MIN_PHOTOS)
  }, [photoCount, onValidChange])

  const handleAddPhoto = (index: number) => {
    // For now, add a placeholder URL — real upload will be implemented later
    if (photos.length < MAX_PHOTOS) {
      const newPhotos = [...photos]
      newPhotos.push(PLACEHOLDER_URLS[index] ?? `/placeholders/photo-${index + 1}.jpg`)
      updateData({ photos: newPhotos })
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    updateData({ photos: newPhotos })
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Add your photos</h2>
        <p className="text-text-secondary mt-1 text-sm">
          Add at least {MIN_PHOTOS} photos to continue.{' '}
          <span className="text-text-muted">
            {photoCount}/{MAX_PHOTOS} added
          </span>
        </p>
      </div>

      {/* Photo grid — 2x3 */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
          const hasPhoto = index < photos.length
          const isMainPhoto = index === 0

          return (
            <div
              key={index}
              className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all duration-200',
                hasPhoto
                  ? 'border-primary/30 bg-primary-light'
                  : 'border-border bg-surface-elevated hover:border-primary/40 hover:bg-primary-light/50 border-dashed',
                isMainPhoto && !hasPhoto && 'border-primary/50',
              )}
            >
              {hasPhoto ? (
                <>
                  {/* Photo placeholder with gradient overlay */}
                  <div className="from-primary/10 to-secondary/10 flex h-full w-full items-center justify-center bg-gradient-to-br">
                    <Camera size={32} weight="fill" className="text-primary/40" />
                  </div>

                  {/* Main photo badge */}
                  {isMainPhoto ? (
                    <div className="bg-primary absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5">
                      <Star size={10} weight="fill" className="text-white" />
                      <span className="text-[10px] font-semibold text-white">Main</span>
                    </div>
                  ) : null}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="hover:bg-danger absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition-colors"
                    aria-label="Remove photo"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAddPhoto(index)}
                  className="flex h-full w-full flex-col items-center justify-center gap-1"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isMainPhoto && photoCount === 0
                        ? 'bg-[image:var(--gradient-brand)] text-white'
                        : 'bg-border text-text-muted',
                    )}
                  >
                    <Plus size={20} weight="bold" />
                  </div>
                  {isMainPhoto && photoCount === 0 ? (
                    <span className="text-primary text-[10px] font-medium">Main Photo</span>
                  ) : null}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Status message */}
      <div
        className={cn(
          'rounded-xl px-4 py-3 text-center text-sm',
          photoCount >= MIN_PHOTOS ? 'bg-success/10 text-success' : 'bg-primary-light text-primary',
        )}
      >
        {photoCount >= MIN_PHOTOS
          ? `Looking great! ${MAX_PHOTOS - photoCount} more spots available.`
          : `Add ${MIN_PHOTOS - photoCount} more photo${MIN_PHOTOS - photoCount > 1 ? 's' : ''} to continue`}
      </div>

      {/* Tips */}
      <div className="text-text-muted space-y-2 text-xs">
        <p>Tips for great photos:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Show your face clearly in your main photo</li>
          <li>Include a mix of close-ups and full-body shots</li>
          <li>Show your hobbies and personality</li>
        </ul>
      </div>
    </div>
  )
}
