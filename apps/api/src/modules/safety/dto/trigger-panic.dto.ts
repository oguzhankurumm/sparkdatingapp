import { z } from 'zod'

export const triggerPanicSchema = z.object({
  latitude: z.string().max(30).optional(),
  longitude: z.string().max(30).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
})

export type TriggerPanicInput = z.infer<typeof triggerPanicSchema>
