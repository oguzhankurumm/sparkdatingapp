'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  CallHistoryItem,
  ReadyForCallUser,
  InitiateCallResponse,
  AcceptCallResponse,
  EndCallResponse,
} from '@spark/types'

// ── Query Key Factory ──────────────────────────────────────

export const callKeys = {
  all: ['calls'] as const,
  readyUsers: () => [...callKeys.all, 'ready-users'] as const,
  history: () => [...callKeys.all, 'history'] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useReadyForCallUsers(limit = 20) {
  return useQuery({
    queryKey: callKeys.readyUsers(),
    queryFn: () => api.get<ReadyForCallUser[]>(`/video-calls/ready-users?limit=${limit}`),
    staleTime: 15 * 1000, // 15s — users go online/offline frequently
  })
}

export function useCallHistory(limit = 20) {
  return useQuery({
    queryKey: callKeys.history(),
    queryFn: () =>
      api.get<{ calls: CallHistoryItem[]; total: number }>(`/video-calls/history?limit=${limit}`),
    staleTime: 30 * 1000,
  })
}

// ── Mutations ──────────────────────────────────────────────

export function useInitiateCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receiverId: string) =>
      api.post<InitiateCallResponse>('/video-calls/initiate', { receiverId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
    },
  })
}

export function useAcceptCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (callId: string) => api.patch<AcceptCallResponse>(`/video-calls/${callId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
    },
  })
}

export function useDeclineCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (callId: string) => api.patch<void>(`/video-calls/${callId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
    },
  })
}

export function useEndCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (callId: string) => api.patch<EndCallResponse>(`/video-calls/${callId}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
    },
  })
}

export function useSetReadyForCall() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (isReady: boolean) => api.patch<void>('/video-calls/ready', { isReady }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: callKeys.readyUsers() })
    },
  })
}

export function useSetCallRate() {
  return useMutation({
    mutationFn: (rate: number) => api.patch<void>('/video-calls/rate', { rate }),
  })
}
