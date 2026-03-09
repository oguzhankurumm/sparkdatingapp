'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-6 text-center">
        <div className="mb-6 text-6xl">💥</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mb-8 max-w-sm text-gray-600">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#E11D48] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
