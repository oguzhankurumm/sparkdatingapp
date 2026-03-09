import { z } from 'zod'

export const applyToTableSchema = z.object({
  message: z.string().max(300).optional(),
})

export type ApplyToTableInput = z.infer<typeof applyToTableSchema>
