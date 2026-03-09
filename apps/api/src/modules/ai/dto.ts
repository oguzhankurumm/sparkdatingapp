import { z } from 'zod'

export const icebreakerSchema = z.object({
  matchId: z.string().uuid(),
})

export type IcebreakerInput = z.infer<typeof icebreakerSchema>

export const messagingCoachSchema = z.object({
  partnerName: z.string().min(1).max(100),
  recentMessages: z
    .array(
      z.object({
        role: z.enum(['user', 'partner']),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .default([]),
  draft: z.string().max(2000).optional(),
})

export type MessagingCoachInput = z.infer<typeof messagingCoachSchema>

export const compatibilityScoreSchema = z.object({
  matchId: z.string().uuid(),
})

export type CompatibilityScoreInput = z.infer<typeof compatibilityScoreSchema>

export const datePlanSchema = z.object({
  matchId: z.string().uuid(),
})

export type DatePlanInput = z.infer<typeof datePlanSchema>
