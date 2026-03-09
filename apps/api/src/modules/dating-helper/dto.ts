import { z } from 'zod'

export const getSuggestionsSchema = z.object({
  matchId: z.string().uuid(),
  recentMessages: z
    .array(
      z.object({
        role: z.enum(['user', 'partner']),
        content: z.string(),
      }),
    )
    .max(20)
    .default([]),
  tone: z.enum(['casual', 'flirty', 'deep', 'funny']).optional(),
})

export type GetSuggestionsInput = z.infer<typeof getSuggestionsSchema>
