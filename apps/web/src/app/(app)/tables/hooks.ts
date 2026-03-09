import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { TableListing, TableDetail, TableGuestInfo, MyTable } from '@spark/types'

// ── Types ──────────────────────────────────────────────

export interface BrowseTablesResponse {
  items: TableListing[]
  nextCursor: string | null
}

export interface MyTablesResponse {
  hosted: MyTable[]
  joined: MyTable[]
}

export interface ApplicationsResponse {
  applications: TableGuestInfo[]
}

export interface CreateTablePayload {
  title: string
  description?: string
  venueName?: string
  venueAddress?: string
  customLocation?: string
  latitude?: number
  longitude?: number
  scheduledAt: string
  maxGuests?: number
  isVip?: boolean
}

export interface ApplyPayload {
  message?: string
}

// ── Query Keys ─────────────────────────────────────────

export const tableKeys = {
  all: ['tables'] as const,
  browse: () => [...tableKeys.all, 'browse'] as const,
  mine: () => [...tableKeys.all, 'mine'] as const,
  detail: (id: string) => [...tableKeys.all, id] as const,
  applications: (id: string) => [...tableKeys.all, id, 'applications'] as const,
}

// ── Queries ────────────────────────────────────────────

/** Browse active tables — infinite cursor-based pagination */
export function useBrowseTables() {
  return useInfiniteQuery({
    queryKey: tableKeys.browse(),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams()
      if (pageParam) params.set('cursor', pageParam)
      const qs = params.toString()
      return api.get<BrowseTablesResponse>(`/tables${qs ? `?${qs}` : ''}`)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  })
}

/** Get the current user's own tables (hosted + joined) */
export function useMyTables() {
  return useQuery({
    queryKey: tableKeys.mine(),
    queryFn: () => api.get<MyTablesResponse>('/tables/mine'),
    staleTime: 30 * 1000,
  })
}

/** Get a single table with guest list */
export function useTableDetail(tableId: string) {
  return useQuery({
    queryKey: tableKeys.detail(tableId),
    queryFn: () => api.get<TableDetail>(`/tables/${tableId}`),
    enabled: !!tableId,
    staleTime: 15 * 1000,
  })
}

/** Get guest applications for a table (host only) */
export function useApplications(tableId: string) {
  return useQuery({
    queryKey: tableKeys.applications(tableId),
    queryFn: () => api.get<ApplicationsResponse>(`/tables/${tableId}/applications`),
    enabled: !!tableId,
    staleTime: 15 * 1000,
  })
}

// ── Mutations ──────────────────────────────────────────

/** Create a new table listing */
export function useCreateTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTablePayload) => api.post<TableDetail>('/tables', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.browse() })
      queryClient.invalidateQueries({ queryKey: tableKeys.mine() })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
    },
  })
}

/** Apply to join a table */
export function useApplyToTable(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data?: ApplyPayload) => api.post<void>(`/tables/${tableId}/apply`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.browse() })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] })
    },
  })
}

/** Host accepts a guest application */
export function useAcceptGuest(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guestId: string) => api.patch<void>(`/tables/${tableId}/guests/${guestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.detail(tableId) })
      queryClient.invalidateQueries({ queryKey: tableKeys.applications(tableId) })
    },
  })
}

/** Host declines a guest application */
export function useDeclineGuest(tableId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (guestId: string) =>
      api.patch<void>(`/tables/${tableId}/guests/${guestId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.applications(tableId) })
    },
  })
}

/** Host cancels their own table */
export function useCancelTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tableId: string) => api.delete<void>(`/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all })
    },
  })
}
