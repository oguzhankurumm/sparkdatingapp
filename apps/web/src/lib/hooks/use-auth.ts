import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api-client'
import { useAuthStore, type User } from '../stores/auth-store'

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Fetch the current user from /auth/me.
 * Syncs the result into the Zustand auth store so that
 * non-query consumers can access user state.
 */
export function useCurrentUser() {
  const { setUser } = useAuthStore()

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const user = await api.get<User>('/auth/me')
      setUser(user)
      return user
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: api.hasToken(), // only fetch when we have a token
  })
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  name: string
  birthDate: string
  gender: 'male' | 'female' | 'non_binary'
}

/**
 * Login mutation.
 * On success: stores tokens, syncs user into Zustand, invalidates auth queries.
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const { login: storeLogin } = useAuthStore()

  return useMutation({
    mutationFn: ({ email, password }: LoginPayload) => storeLogin(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

/**
 * Register mutation.
 * On success: stores tokens, syncs user into Zustand, invalidates auth queries.
 */
export function useRegister() {
  const queryClient = useQueryClient()
  const { register: storeRegister } = useAuthStore()

  return useMutation({
    mutationFn: (data: RegisterPayload) => storeRegister(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

/**
 * Logout mutation.
 * Clears tokens, resets Zustand state, and wipes all cached queries.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const { logout: storeLogout } = useAuthStore()

  return useMutation({
    mutationFn: () => storeLogout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
