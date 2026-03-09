import { z } from 'zod'

export const icebreakerSchema = z.object({
  matchId: z.string().uuid(),
})

export type IcebreakerInput = z.infer<typeof icebreakerSchema>
