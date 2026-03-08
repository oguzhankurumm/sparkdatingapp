import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface OnboardingData {
  // Step 1: BasicInfo
  firstName?: string
  birthday?: string // ISO date string
  gender?: 'male' | 'female' | 'non_binary'

  // Step 2: Photos (min 2, max 6)
  photos?: string[] // URLs after upload

  // Step 3: Bio + Prompts
  bio?: string
  prompts?: Array<{ question: string; answer: string }>

  // Step 4: Location
  latitude?: number
  longitude?: number
  city?: string
  country?: string

  // Step 5: Interests (min 3)
  interests?: string[]

  // Step 6: Relationship Goals
  relationshipGoal?: 'long_term' | 'short_term' | 'friends' | 'unsure'

  // Step 7: Discovery Preferences
  showMe?: 'men' | 'women' | 'everyone'
  ageRangeMin?: number
  ageRangeMax?: number
  maxDistanceKm?: number

  // Step 8: Notifications (optional)
  notificationsEnabled?: boolean

  // Step 9: Photo Verify (optional)
  verificationPhotoUrl?: string
}

const TOTAL_STEPS = 9

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

interface OnboardingState {
  currentStep: number
  data: OnboardingData

  setStep: (step: number) => void
  updateData: (partial: Partial<OnboardingData>) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      data: {},

      setStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),

      updateData: (partial) => set((state) => ({ data: { ...state.data, ...partial } })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      reset: () => set({ currentStep: 1, data: {} }),
    }),
    {
      name: 'spark-onboarding', // localStorage key
    },
  ),
)
