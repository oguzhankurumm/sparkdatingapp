'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleLogo } from '@phosphor-icons/react'
import { ZodError } from 'zod'
import { loginSchema } from '@spark/validators'
import { AuthLayout, Button, Input, FormField } from '@spark/ui'
import { useLogin } from '@/lib/hooks/use-auth'

interface FieldErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()
  const loginMutation = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setApiError(null)

    // Validate with Zod
    try {
      loginSchema.parse({ email, password })
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: FieldErrors = {}
        for (const issue of err.issues) {
          const field = issue.path[0] as keyof FieldErrors
          if (!errors[field]) {
            errors[field] = issue.message
          }
        }
        setFieldErrors(errors)
        return
      }
    }

    // Call login mutation
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push('/discover')
        },
        onError: (error) => {
          setApiError(error.message || 'Something went wrong. Please try again.')
        },
      },
    )
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue">
      {/* Google OAuth */}
      <Button type="button" variant="secondary" size="lg" className="w-full">
        <GoogleLogo size={20} weight="bold" />
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="border-border w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-elevated text-text-muted px-2">or</span>
        </div>
      </div>

      {/* API Error */}
      {apiError ? (
        <div className="border-danger/20 bg-danger/5 text-danger mb-4 rounded-lg border px-4 py-3 text-sm">
          {apiError}
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" htmlFor="email" error={fieldErrors.email} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!fieldErrors.email}
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={fieldErrors.password} required>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!fieldErrors.password}
            autoComplete="current-password"
          />
        </FormField>

        {/* Forgot password — plain <a> because the route is not built yet */}
        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className="text-text-secondary hover:text-primary text-sm transition-colors"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loginMutation.isPending}
        >
          Sign in
        </Button>
      </form>

      {/* Bottom link */}
      <p className="text-text-secondary mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
