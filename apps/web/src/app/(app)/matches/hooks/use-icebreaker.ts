import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface IcebreakerResponse {
  suggestions: string[]
  refreshesRemaining: number
}

export function useIcebreaker() {
  return useMutation({
    mutationFn: async (matchId: string) => {
      return api.post<IcebreakerResponse>('/ai/icebreaker', { matchId })
    },
  })
}
