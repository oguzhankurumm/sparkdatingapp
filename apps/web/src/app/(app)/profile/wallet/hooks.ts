'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  WalletData,
  WalletTransactionsResponse,
  CoinPackageItem,
  PurchaseResponse,
  WithdrawResponse,
} from '@spark/types'

// ── Query Key Factory ──────────────────────────────────────

export const walletKeys = {
  all: ['wallet'] as const,
  data: () => [...walletKeys.all, 'data'] as const,
  transactions: (page: number) => [...walletKeys.all, 'transactions', page] as const,
  coinPackages: () => [...walletKeys.all, 'coin-packages'] as const,
}

// ── Queries ────────────────────────────────────────────────

export function useWalletData() {
  return useQuery({
    queryKey: walletKeys.data(),
    queryFn: () => api.get<WalletData>('/wallet/me'),
    staleTime: 60 * 1000,
  })
}

export function useWalletTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: walletKeys.transactions(page),
    queryFn: () =>
      api.get<WalletTransactionsResponse>(`/wallet/transactions?page=${page}&limit=${limit}`),
    staleTime: 30 * 1000,
  })
}

export function useCoinPackages() {
  return useQuery({
    queryKey: walletKeys.coinPackages(),
    queryFn: () => api.get<CoinPackageItem[]>('/wallet/coin-packages'),
    staleTime: 5 * 60 * 1000, // packages rarely change
  })
}

// ── Mutations ──────────────────────────────────────────────

export function usePurchaseTokens() {
  return useMutation({
    mutationFn: (packageId: string) =>
      api.post<PurchaseResponse>('/wallet/purchase', { packageId }),
    onSuccess: (data) => {
      // Redirect to Stripe Checkout (or placeholder)
      window.location.href = data.checkoutUrl
    },
  })
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { amount: number; method: string }) =>
      api.post<WithdrawResponse>('/wallet/withdraw', params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.data() })
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions(1) })
    },
  })
}
