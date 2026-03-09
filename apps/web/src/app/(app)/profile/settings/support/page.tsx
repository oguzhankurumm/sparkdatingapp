'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@spark/ui'
import {
  CaretLeft,
  Envelope,
  ChatCircle,
  Bug,
  ShieldWarning,
  UserMinus,
  CreditCard,
  PaperPlaneTilt,
  CheckCircle,
} from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Contact Support Page
// ──────────────────────────────────────────────

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'safety', label: 'Safety Concern', icon: ShieldWarning },
  { value: 'account', label: 'Account Issue', icon: UserMinus },
  { value: 'billing', label: 'Billing & Tokens', icon: CreditCard },
  { value: 'other', label: 'Other', icon: ChatCircle },
] as const

type Category = (typeof CATEGORIES)[number]['value']

export default function SupportPage() {
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = category && subject.trim().length > 0 && message.trim().length >= 10

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!isValid) return
      setLoading(true)
      setError(null)
      try {
        await api.post('/support/tickets', { category, subject, message })
        setSubmitted(true)
      } catch {
        setError('Failed to submit. Please try again or email us at support@spark.app')
      } finally {
        setLoading(false)
      }
    },
    [isValid, category, subject, message],
  )

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" weight="fill" />
        </div>
        <h2 className="text-text-primary mb-2 text-xl font-bold">Message Sent</h2>
        <p className="text-text-secondary mb-1 text-sm">
          We&apos;ve received your support request. Our team usually responds within 24 hours.
        </p>
        <p className="text-text-muted text-xs">Check your email for updates.</p>
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
        <h1 className="text-text-primary text-xl font-bold">Contact Support</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4">
        {/* Email info */}
        <div className="border-border bg-surface-elevated flex items-center gap-3 rounded-2xl border p-4">
          <Envelope className="text-primary h-5 w-5 shrink-0" />
          <div>
            <p className="text-text-primary text-sm font-medium">Email us directly</p>
            <p className="text-primary text-sm">support@spark.app</p>
          </div>
        </div>

        <div className="border-border-subtle border-t" />

        {/* Category selector */}
        <div>
          <label className="text-text-primary mb-3 block text-sm font-medium">
            What&apos;s this about?
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const selected = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-primary/10 text-primary border-primary border'
                      : 'border-border hover:bg-surface text-text-primary border'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-text-primary mb-1.5 block text-sm font-medium">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div>
          <label className="text-text-primary mb-1.5 block text-sm font-medium">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={5}
            maxLength={2000}
            className="border-border bg-surface-elevated text-text-primary placeholder:text-text-muted focus:ring-primary w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2"
          />
          <p className="text-text-muted mt-1 text-right text-xs">{message.length}/2000</p>
        </div>

        {error && <p className="bg-danger/10 text-danger rounded-lg p-3 text-sm">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!isValid}
        >
          <PaperPlaneTilt className="h-5 w-5" />
          Send Message
        </Button>
      </form>
    </div>
  )
}
