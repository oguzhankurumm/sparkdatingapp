import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  MatchesResponse,
  MatchDetail,
  MessagesResponse,
  SendMessagePayload,
  Message,
} from './types'

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

export const matchKeys = {
  all: ['matches'] as const,
  list: () => [...matchKeys.all, 'list'] as const,
  detail: (id: string) => [...matchKeys.all, id] as const,
  messages: (matchId: string) => [...matchKeys.all, matchId, 'messages'] as const,
}

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * Fetch all matches — separated into newMatches (no messages) and matches (with messages).
 */
export function useMatches() {
  return useQuery({
    queryKey: matchKeys.list(),
    queryFn: () => api.get<MatchesResponse>('/matches'),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Fetch a single match detail — used in the chat header.
 */
export function useMatch(matchId: string) {
  return useQuery({
    queryKey: matchKeys.detail(matchId),
    queryFn: () => api.get<MatchDetail>(`/matches/${matchId}`),
    enabled: !!matchId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch messages for a match — infinite query with cursor-based pagination.
 * Loads older messages as the user scrolls up.
 */
export function useMessages(matchId: string) {
  return useInfiniteQuery({
    queryKey: matchKeys.messages(matchId),
    queryFn: ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : ''
      return api.get<MessagesResponse>(`/matches/${matchId}/messages${params}`)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!matchId,
    staleTime: 0, // always fresh
  })
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

/**
 * Send a message — optimistic update for instant UI feedback.
 */
export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      api.post<Message>(`/matches/${matchId}/messages`, payload),
    onSuccess: () => {
      // Invalidate messages to refetch latest
      queryClient.invalidateQueries({
        queryKey: matchKeys.messages(matchId),
      })
      // Also invalidate the matches list to update lastMessage preview
      queryClient.invalidateQueries({
        queryKey: matchKeys.list(),
      })
    },
  })
}

/**
 * Mark messages as read for a match.
 */
export function useMarkAsRead(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>(`/matches/${matchId}/messages/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: matchKeys.list(),
      })
    },
  })
}

/**
 * Unmatch a user — removes the match entirely.
 */
export function useUnmatch(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<void>(`/matches/${matchId}/unmatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: matchKeys.all,
      })
    },
  })
}
