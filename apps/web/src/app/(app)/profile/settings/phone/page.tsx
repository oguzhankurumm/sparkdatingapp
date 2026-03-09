'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, OtpInput } from '@spark/ui'
import { CaretLeft, Phone, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Phone Number Page
// ──────────────────────────────────────────────

export default function PhoneNumberPage() {
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const [step, setStep] = useState<'input' | 'verify' | 'done'>('input')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO: Add `phone` field to User type when backend supports it
  const currentPhone = (user as unknown as { phone?: string })?.phone

  const handleSendOtp = useCallback(async () => {
    if (phone.length < 10) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/phone/send-otp', { phone })
      setStep('verify')
    } catch {
      setError('Failed to send verification code. Please check the number and try again.')
    } finally {
      setLoading(false)
    }
  }, [phone])

  const handleVerifyOtp = useCallback(async () => {
    if (otp.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/phone/verify-otp', { phone, code: otp })
      setStep('done')
    } catch {
      setError('Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [otp, phone])

  if (step === 'done') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" weight="fill" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Phone Verified</h2>
        <p className="text-text-secondary text-sm">
          Your phone number has been {currentPhone ? 'updated' : 'added'} successfully.
        </p>
        <Button variant="primary" size="md" className="mt-6" onClick={() => router.back()}>
          Back to Settings
        </Button>
      </div>
    )
  }

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
        <h1 className="text-text-primary text-xl font-bold">Phone Number</h1>
      </div>

      <div className="space-y-6 px-4">
        {/* Current phone */}
        {currentPhone && (
          <div className="border-border bg-surface-elevated flex items-center gap-3 rounded-2xl border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" weight="fill" />
            </div>
            <div>
              <p className="text-text-primary text-sm font-semibold">Current number</p>
              <p className="text-text-secondary text-sm">{currentPhone}</p>
            </div>
          </div>
        )}

        {step === 'input' && (
          <>
            <div>
              <label className="text-text-primary mb-1.5 block text-sm font-medium">
                {currentPhone ? 'New Phone Number' : 'Phone Number'}
              </label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="flex-1"
                  autoComplete="tel"
                />
              </div>
              <p className="text-text-muted mt-1.5 text-xs">
                We&apos;ll send a 6-digit verification code via SMS
              </p>
            </div>

            {/* 2FA Info */}
            <div className="border-border bg-surface-elevated rounded-2xl border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Phone className="text-primary h-4 w-4" />
                <p className="text-text-primary text-sm font-semibold">Two-Factor Authentication</p>
              </div>
              <p className="text-text-secondary text-sm">
                Adding a phone number enables 2FA for extra security on your account.
              </p>
            </div>

            {error && <p className="bg-danger/10 text-danger rounded-lg p-3 text-sm">{error}</p>}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSendOtp}
              loading={loading}
              disabled={phone.length < 10}
            >
              Send Verification Code
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="text-center">
              <p className="text-text-primary text-sm font-medium">
                Enter the 6-digit code sent to
              </p>
              <p className="text-primary font-semibold">{phone}</p>
            </div>

            <div className="flex justify-center">
              <OtpInput length={6} value={otp} onChange={setOtp} />
            </div>

            <button
              onClick={() => {
                setStep('input')
                setOtp('')
                setError(null)
              }}
              className="text-primary block w-full text-center text-sm font-medium"
            >
              Change number
            </button>

            {error && <p className="bg-danger/10 text-danger rounded-lg p-3 text-sm">{error}</p>}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleVerifyOtp}
              loading={loading}
              disabled={otp.length !== 6}
            >
              Verify
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
