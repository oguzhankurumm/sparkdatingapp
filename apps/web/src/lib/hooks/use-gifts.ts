'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { GiftTypeItem, SendGiftResponse, GiftHistoryResponse, GiftContext } from '@spark/types'

/** Fetch all active gift types from the API */
export function useGiftTypes(category?: string) {
  const path = category ? `/gifts/types?category=${category}` : '/gifts/types'
  return useQuery({
    queryKey: ['gift-types', category ?? 'all'],
    queryFn: () => api.get<GiftTypeItem[]>(path),
    staleTime: 5 * 60 * 1000, // gift catalog rarely changes
  })
}

/** Send a gift to a recipient */
export function useSendGift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      recipientId: string
      giftTypeId: string
      context: GiftContext
      contextReferenceId?: string
    }) => api.post<SendGiftResponse>('/gifts/send', params),
    onSuccess: () => {
      // Invalidate wallet balance so UI reflects the new balance
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    },
  })
}

/** Fetch gift history for the current user */
export function useGiftHistory(
  direction: 'sent' | 'received' | 'all' = 'all',
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: ['gift-history', direction, page, limit],
    queryFn: () =>
      api.get<GiftHistoryResponse>(
        `/gifts/history?direction=${direction}&page=${page}&limit=${limit}`,
      ),
  })
}
