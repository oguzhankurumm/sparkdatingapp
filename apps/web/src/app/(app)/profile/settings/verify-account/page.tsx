'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button, Skeleton } from '@spark/ui'
import {
  CaretLeft,
  Camera,
  CheckCircle,
  ShieldCheck,
  UploadSimple,
  Clock,
} from '@phosphor-icons/react'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Verify Account Page
// ──────────────────────────────────────────────

export default function VerifyAccountPage() {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Add `kycStatus` field to User type when backend supports it
  const status = (user as unknown as { kycStatus?: string })?.kycStatus ?? 'none'

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10 MB')
      return
    }
    setError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  const handleSubmit = useCallback(async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('selfie', file)
      await api.post('/users/me/verify', formData)
      setSubmitted(true)
    } catch {
      setError('Verification failed. Please try again with a clearer photo.')
    } finally {
      setUploading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-48 rounded-lg" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // Already verified
  if (status === 'verified') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" weight="fill" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Verified Account</h2>
        <p className="text-text-secondary mb-1 text-sm">
          Your identity has been verified. You have a blue verification badge on your profile.
        </p>
        <Button variant="secondary" size="md" className="mt-6" onClick={() => router.back()}>
          Back to Settings
        </Button>
      </div>
    )
  }

  // Pending review
  if (status === 'pending' || submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" weight="fill" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Under Review</h2>
        <p className="text-text-secondary mb-1 text-sm">
          Your selfie has been submitted. Verification usually takes 1-24 hours.
        </p>
        <p className="text-text-muted text-xs">We&apos;ll notify you when it&apos;s complete.</p>
        <Button variant="secondary" size="md" className="mt-6" onClick={() => router.back()}>
          Back to Settings
        </Button>
      </div>
    )
  }

  // Not verified — show upload flow
  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-4">
        <button
          onClick={() => router.back()}
          className="text-text-muted hover:text-text-primary flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label="Go back"
        >
          <CaretLeft className="h-5 w-5" />
        </button>
        <h1 className="text-text-primary text-xl font-bold">Verify Your Account</h1>
      </div>

      <div className="space-y-6 px-4">
        {/* Info card */}
        <div className="border-border bg-surface-elevated rounded-2xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle className="text-primary h-5 w-5" weight="fill" />
            <p className="text-text-primary text-sm font-semibold">Get the Blue Tick</p>
          </div>
          <ul className="text-text-secondary space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 text-xs">●</span>
              Verified badge on your profile
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 text-xs">●</span>
              Higher visibility in discovery
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5 text-xs">●</span>
              Build trust with matches
            </li>
          </ul>
        </div>

        {/* Selfie upload */}
        <div>
          <p className="text-text-primary mb-3 text-sm font-medium">
            Take a selfie matching the pose below
          </p>

          {/* Pose instruction */}
          <div className="border-border bg-surface mb-4 flex items-center justify-center rounded-2xl border p-8">
            <div className="text-center">
              <div className="bg-surface-elevated mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full">
                <Camera className="text-text-muted h-10 w-10" />
              </div>
              <p className="text-text-muted text-xs">
                Hold your hand next to your face with a peace sign ✌️
              </p>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative mb-4 overflow-hidden rounded-2xl">
              <Image
                src={preview}
                alt="Selfie preview"
                width={400}
                height={400}
                className="h-64 w-full object-cover"
              />
              <button
                onClick={() => {
                  setPreview(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* File input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview ? (
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <UploadSimple className="h-5 w-5" />
              Upload Selfie
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              loading={uploading}
            >
              Submit for Verification
            </Button>
          )}
        </div>

        {error && <p className="bg-danger/10 text-danger rounded-lg p-3 text-sm">{error}</p>}

        <p className="text-text-muted text-center text-xs">
          Your selfie is used only for verification and is deleted after review.
        </p>
      </div>
    </div>
  )
}
