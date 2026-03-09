import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// ── Types ──────────────────────────────────────────────

export interface PanicEvent {
  id: string
  userId: string
  latitude?: string | null
  longitude?: string | null
  emergencyContactPhone?: string | null
  emergencyContactName?: string | null
  smsSent: boolean
  adminAlertSent: boolean
  resolvedAt?: string | null
  autoResetAt?: string | null
  triggeredAt: string
}

interface TriggerPanicInput {
  latitude?: string
  longitude?: string
  deviceInfo?: Record<string, unknown>
}

interface TriggerPanicResponse {
  eventId: string
  autoResetAt: string
  emergencyContactNotified: boolean
}

interface ResolveResponse {
  resolved: boolean
  eventId: string
}

// ── Query Keys ─────────────────────────────────────────

const safetyKeys = {
  all: ['safety'] as const,
  status: () => [...safetyKeys.all, 'status'] as const,
}

// ── Hooks ──────────────────────────────────────────────

/** Check if user currently has an active (unresolved) panic event */
export function useSafetyStatus() {
  return useQuery({
    queryKey: safetyKeys.status(),
    queryFn: async () => {
      const res = await api.get<{ active: boolean; event: PanicEvent | null }>('/safety/status')
      return res
    },
    // Poll every 30 seconds while panic is active
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.active ? 30_000 : false
    },
  })
}

/** Trigger panic mode — sends location, hides profile, alerts contacts */
export function useTriggerPanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input?: TriggerPanicInput) => {
      return api.post<TriggerPanicResponse>('/safety/panic', input ?? {})
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: safetyKeys.status() })
    },
  })
}

/** Resolve panic — restores profile visibility */
export function useResolvePanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return api.post<ResolveResponse>('/safety/resolve', {})
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: safetyKeys.status() })
    },
  })
}
