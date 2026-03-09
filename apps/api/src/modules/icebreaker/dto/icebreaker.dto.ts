import { z } from 'zod'

export const generateIcebreakerSchema = z.object({
  matchId: z.string().uuid(),
})

export type GenerateIcebreakerDto = z.infer<typeof generateIcebreakerSchema>
