import { create } from 'zustand'
import { api } from '../api-client'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName: string
  gender: 'male' | 'female' | 'non_binary'
  avatarUrl: string | null
  isVerified: boolean
  role: 'user' | 'admin'
  onboardingCompleted: boolean
  plan: 'free' | 'premium' | 'platinum'
  autoTranslate: boolean
  preferredLanguage: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

interface RegisterPayload {
  email: string
  password: string
  name: string
  birthDate: string
  gender: 'male' | 'female' | 'non_binary'
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  login: async (email, password) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password })
    api.setTokens(res.accessToken, res.refreshToken)
    set({ user: res.user, isAuthenticated: true, isLoading: false })
  },

  register: async (data) => {
    const res = await api.post<AuthResponse>('/auth/register', data)
    api.setTokens(res.accessToken, res.refreshToken)
    set({ user: res.user, isAuthenticated: true, isLoading: false })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Logout failure is non-critical — always clear local state
    }
    api.clearTokens()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  fetchMe: async () => {
    try {
      const user = await api.get<User>('/auth/me')
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
