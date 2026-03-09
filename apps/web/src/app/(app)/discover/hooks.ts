import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

// ── Types ──────────────────────────────────────────────

export interface DiscoverProfile {
  user: {
    id: string
    firstName: string
    age: number
    avatarUrl: string
    city?: string
    zodiac?: string
    zodiacCompat?: number
    distance?: string
    isVerified?: boolean
    bio?: string
    interests?: string[]
  }
  score: number
}

export interface DiscoverFeedResponse {
  profiles: DiscoverProfile[]
  hasMore: boolean
}

export interface TrendingProfile {
  id: string
  firstName: string
  age: number
  avatarUrl: string
  city?: string
  isVerified: boolean
  likesCount: number
}

export interface TrendingResponse {
  profiles: TrendingProfile[]
}

export interface ReadyToCallUser {
  id: string
  firstName: string
  avatarUrl: string
  city?: string
}

export interface ReadyToCallResponse {
  users: ReadyToCallUser[]
}

export interface NearbyUser {
  id: string
  firstName: string
  avatarUrl: string
  latitude: number
  longitude: number
}

export interface NearbyResponse {
  users: NearbyUser[]
}

export interface NearbyTable {
  id: string
  title: string
  description: string | null
  scheduledAt: string
  maxGuests: number
  guestCount: number
  spotsRemaining: number
  isVip: boolean
  hostFirstName: string
  hostAvatarUrl: string | null
  imageUrl: string | null
}

export interface NearbyTablesResponse {
  tables: NearbyTable[]
}

export interface LikeReceivedProfile {
  id: string
  firstName: string
  age: number
  avatarUrl: string
  city?: string
  isVerified: boolean
  likedAt: string
  blurred: boolean
}

export interface LikesReceivedResponse {
  profiles: LikeReceivedProfile[]
  total: number
}

export interface LikePayload {
  receiverId: string
  type: 'like' | 'pass' | 'super_like'
}

// ── Hooks ──────────────────────────────────────────────

export function useDiscoverFeed() {
  return useQuery<DiscoverFeedResponse>({
    queryKey: ['discover', 'feed'],
    queryFn: () => api.get<DiscoverFeedResponse>('/discovery/feed'),
  })
}

export function useTrending() {
  return useQuery<TrendingResponse>({
    queryKey: ['discover', 'trending'],
    queryFn: () => api.get<TrendingResponse>('/discovery/trending'),
  })
}

export function useReadyToCall() {
  return useQuery<ReadyToCallResponse>({
    queryKey: ['discover', 'ready-to-call'],
    queryFn: () => api.get<ReadyToCallResponse>('/discovery/ready-to-call'),
  })
}

export function useNearbyUsers() {
  return useQuery<NearbyResponse>({
    queryKey: ['discover', 'nearby'],
    queryFn: () => api.get<NearbyResponse>('/discovery/nearby'),
  })
}

export function useNearbyTables() {
  return useQuery<NearbyTablesResponse>({
    queryKey: ['discover', 'nearby-tables'],
    queryFn: () => api.get<NearbyTablesResponse>('/discovery/nearby-tables'),
  })
}

export function useLikesReceived() {
  return useQuery<LikesReceivedResponse>({
    queryKey: ['discover', 'likes-received'],
    queryFn: () => api.get<LikesReceivedResponse>('/discovery/likes-received'),
  })
}

export function useSendLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LikePayload) => api.post('/likes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover', 'feed'] })
    },
  })
}
