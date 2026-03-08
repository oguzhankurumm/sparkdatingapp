'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@spark/ui'
import { ArrowLeft, Camera, X, Check, Trash } from '@phosphor-icons/react'
import { api } from '@/lib/api-client'

// ──────────────────────────────────────────────
// Zod Schema
// ──────────────────────────────────────────────

const editProfileSchema = z.object({
  firstName: z.string().min(2, 'Name must be at least 2 characters').max(32, 'Name is too long'),
  bio: z.string().max(300, 'Bio is too long (max 300 chars)').optional().nullable(),
  prompts: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().max(150, 'Answer too long (max 150 chars)'),
      }),
    )
    .max(3),
  interests: z.array(z.string()).min(3, 'Please select at least 3 interests'),
  photos: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        isPrimary: z.boolean(),
      }),
    )
    .min(2, 'Please add at least 2 photos'),
})

type EditProfileValues = z.infer<typeof editProfileSchema>

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const PROMPT_OPTIONS = [
  'My ideal weekend looks like\u2026',
  'The way to my heart is\u2026',
  'I get excited about\u2026',
  'A fun fact about me is\u2026',
  'My love language is\u2026',
  "I'm looking for someone who\u2026",
  'My biggest quirk is\u2026',
  "On a Friday night I'm\u2026",
]

const INTEREST_OPTIONS = [
  'Coffee',
  'Travel',
  'Yoga',
  'Cooking',
  'Music',
  'Art',
  'Gaming',
  'Hiking',
  'Photography',
  'Movies',
  'Books',
  'Fitness',
  'Dancing',
  'Foodie',
  'Tech',
  'Fashion',
  'Pets',
  'Nature',
  'Wine',
  'Podcasts',
]

// ──────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────

function useEditProfile() {
  return useQuery({
    queryKey: ['profile', 'edit'],
    queryFn: () => api.get<EditProfileValues>('/users/me/profile'),
    staleTime: 5 * 60 * 1000,
  })
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useEditProfile()

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: '',
      bio: '',
      prompts: [],
      interests: [],
      photos: [],
    },
  })

  const {
    fields: promptFields,
    append: appendPrompt,
    remove: removePrompt,
  } = useFieldArray({ control, name: 'prompts' })

  // Hydrate form when profile data loads
  useEffect(() => {
    if (profile) reset(profile)
  }, [profile, reset])

  const saveMutation = useMutation({
    mutationFn: (data: EditProfileValues) => api.patch('/users/me/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const onSubmit = handleSubmit((data) => saveMutation.mutate(data))

  // Auto-save on change (1 s debounce)
  const watchedValues = watch()

  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      handleSubmit((data) => saveMutation.mutate(data))()
    }, 1000)
    return () => clearTimeout(timer)
  }, [JSON.stringify(watchedValues), isDirty])

  if (isLoading) return <EditSkeleton />

  return (
    <div className="mx-auto max-w-2xl pb-24">
      {/* ─── Header ─── */}
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="text-text-secondary hover:bg-surface flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-text-primary text-base font-semibold">Edit Profile</h1>

        <div className="flex items-center gap-2">
          {saveMutation.isSuccess && <Check className="text-success h-5 w-5" />}
          {(isSubmitting || saveMutation.isPending) && (
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-0">
        {/* ─── Photos ─── */}
        <Section title="Photos" subtitle="Add up to 6 photos. Your first photo is your main photo.">
          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {field.value.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="bg-surface relative aspect-[3/4] overflow-hidden rounded-2xl"
                    >
                      <Image
                        src={photo.url}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                      {photo.isPrimary && (
                        <div className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                          Main
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => field.onChange(field.value.filter((p) => p.id !== photo.id))}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {field.value.length < 6 && (
                    <button
                      type="button"
                      className="border-border-subtle bg-surface text-text-muted hover:border-primary hover:text-primary flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed transition-colors"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-xs">Add photo</span>
                    </button>
                  )}
                </div>
                {errors.photos && (
                  <p className="text-danger mt-2 text-xs">{errors.photos.message}</p>
                )}
              </>
            )}
          />
        </Section>

        {/* ─── Basic Info ─── */}
        <Section title="Basic Info">
          <div className="space-y-3">
            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                First Name
              </label>
              <input
                {...register('firstName')}
                type="text"
                className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                placeholder="Your first name"
              />
              {errors.firstName && (
                <p className="text-danger mt-1 text-xs">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="text-text-muted mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                Bio
              </label>
              <Controller
                control={control}
                name="bio"
                render={({ field }) => (
                  <>
                    <textarea
                      {...field}
                      value={field.value ?? ''}
                      className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20 w-full resize-none rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2"
                      placeholder="Write something about yourself…"
                      rows={4}
                      maxLength={300}
                    />
                    <p className="text-text-muted mt-1 text-right text-xs">
                      {(field.value ?? '').length}/300
                    </p>
                  </>
                )}
              />
              {errors.bio && <p className="text-danger mt-1 text-xs">{errors.bio.message}</p>}
            </div>
          </div>
        </Section>

        {/* ─── Prompts ─── */}
        <Section title="Prompts" subtitle="Answer up to 3 prompts to show your personality.">
          <div className="space-y-3">
            {promptFields.map((field, idx) => (
              <div
                key={field.id}
                className="border-border bg-surface-elevated rounded-2xl border p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">
                    {field.question}
                  </p>
                  <button
                    type="button"
                    onClick={() => removePrompt(idx)}
                    className="text-text-muted hover:text-danger transition-colors"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
                <Controller
                  control={control}
                  name={`prompts.${idx}.answer`}
                  render={({ field: answerField }) => (
                    <>
                      <textarea
                        {...answerField}
                        className="border-border bg-surface text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-primary/20 w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        placeholder="Your answer…"
                        rows={3}
                        maxLength={150}
                      />
                      <p className="text-text-muted mt-1 text-right text-xs">
                        {answerField.value?.length ?? 0}/150
                      </p>
                    </>
                  )}
                />
              </div>
            ))}

            {promptFields.length < 3 && (
              <div className="border-border-subtle rounded-2xl border border-dashed p-4">
                <p className="text-text-secondary mb-3 text-sm font-medium">Add a prompt</p>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_OPTIONS.filter((q) => !promptFields.find((f) => f.question === q)).map(
                    (q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => appendPrompt({ question: q, answer: '' })}
                        className="border-border bg-surface text-text-secondary hover:border-primary hover:text-primary rounded-full border px-3 py-1.5 text-xs transition-colors"
                      >
                        {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ─── Interests ─── */}
        <Section
          title="Interests"
          subtitle="Pick at least 3 interests to help us find your matches."
        >
          <Controller
            control={control}
            name="interests"
            render={({ field }) => (
              <>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((tag) => {
                    const active = field.value.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          field.onChange(
                            active ? field.value.filter((i) => i !== tag) : [...field.value, tag],
                          )
                        }
                        className={[
                          'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface text-text-secondary hover:border-primary/50',
                        ].join(' ')}
                      >
                        {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {tag}
                      </button>
                    )
                  })}
                </div>
                <p className="text-text-muted mt-3 text-xs">
                  {field.value.length} selected
                  {field.value.length < 3 && (
                    <span className="text-danger ml-1">(min 3 required)</span>
                  )}
                </p>
                {errors.interests && (
                  <p className="text-danger mt-1 text-xs">{errors.interests.message}</p>
                )}
              </>
            )}
          />
        </Section>

        {/* ─── Save button (manual fallback) ─── */}
        <div className="px-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!isDirty || isSubmitting || saveMutation.isPending}
          >
            {isSubmitting || saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
          {saveMutation.isSuccess && (
            <p className="text-success mt-2 text-center text-sm">Profile saved ✓</p>
          )}
        </div>
      </form>
    </div>
  )
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6 px-4 pt-4">
      <div className="mb-3">
        <h2 className="text-text-primary text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-text-muted mt-0.5 text-xs">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="bg-surface mb-6 h-8 w-40 animate-pulse rounded-lg" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface aspect-[3/4] animate-pulse rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface h-16 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
