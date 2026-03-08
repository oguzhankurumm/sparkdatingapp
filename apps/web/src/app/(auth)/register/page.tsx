'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleLogo } from '@phosphor-icons/react'
import { ZodError } from 'zod'
import { registerSchema } from '@spark/validators'
import { AuthLayout, Button, Input, FormField, cn } from '@spark/ui'
import { useRegister } from '@/lib/hooks/use-auth'

type Gender = 'male' | 'female' | 'non_binary'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  birthDate?: string
  gender?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const registerMutation = useRegister()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setApiError(null)

    // Validate with Zod
    try {
      registerSchema.parse({ name, email, password, birthDate, gender })
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

    // Call register mutation
    registerMutation.mutate(
      {
        name,
        email,
        password,
        birthDate,
        gender: gender as Gender,
      },
      {
        onSuccess: () => {
          router.push('/onboarding')
        },
        onError: (error) => {
          setApiError(error.message || 'Something went wrong. Please try again.')
        },
      },
    )
  }

  return (
    <AuthLayout title="Create account" subtitle="Join Spark and start connecting">
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
        <FormField label="Name" htmlFor="name" error={fieldErrors.name} required>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!fieldErrors.name}
            autoComplete="name"
          />
        </FormField>

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

        <FormField
          label="Password"
          htmlFor="password"
          error={fieldErrors.password}
          helperText={!fieldErrors.password ? 'Min 8 chars, 1 uppercase, 1 number' : undefined}
          required
        >
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!fieldErrors.password}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Birthday" htmlFor="birthDate" error={fieldErrors.birthDate} required>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={!!fieldErrors.birthDate}
          />
        </FormField>

        <FormField label="Gender" htmlFor="gender" error={fieldErrors.gender} required>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender | '')}
            className={cn(
              'border-border bg-surface-elevated text-text-primary h-11 w-full rounded-xl border px-4 text-sm transition-all duration-200',
              'focus:ring-primary/30 focus:border-primary focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !gender && 'text-text-muted',
              fieldErrors.gender && 'border-danger focus:ring-danger/30',
            )}
          >
            <option value="" disabled>
              Select your gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
          </select>
        </FormField>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={registerMutation.isPending}
        >
          Create account
        </Button>
      </form>

      {/* Bottom link */}
      <p className="text-text-secondary mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
