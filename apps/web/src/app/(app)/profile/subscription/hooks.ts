'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  SubscriptionMeResponse,
  SubscriptionCheckoutResponse,
  SubscriptionPortalResponse,
  BillingInterval,
  SubscriptionPlan,
} from '@spark/types'

// ── Query Key Factory ──────────────────────────────────────

export const subscriptionKeys = {
  all: ['subscription'] as const,
  me: () => [...subscriptionKeys.all, 'me'] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.me(),
    queryFn: () => api.get<SubscriptionMeResponse>('/subscriptions/me'),
    staleTime: 60 * 1000,
  })
}

// ── Mutations ──────────────────────────────────────────────

export function useCheckout() {
  return useMutation({
    mutationFn: (params: { planId: SubscriptionPlan; billingCycle: BillingInterval }) =>
      api.post<SubscriptionCheckoutResponse>('/subscriptions/checkout', params),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
  })
}

export function useManagePortal() {
  return useMutation({
    mutationFn: () => api.post<SubscriptionPortalResponse>('/subscriptions/portal'),
    onSuccess: (data) => {
      window.location.href = data.portalUrl
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<{ cancelledAt: string }>('/subscriptions/cancel'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.me() })
    },
  })
}
