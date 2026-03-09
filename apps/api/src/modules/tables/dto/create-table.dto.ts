import { z } from 'zod'

export const createTableSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  venueName: z.string().max(100).optional(),
  venueAddress: z.string().max(500).optional(),
  customLocation: z.string().max(300).optional(),
  latitude: z.string().max(30).optional(),
  longitude: z.string().max(30).optional(),
  scheduledAt: z.string().datetime(),
  maxGuests: z.number().int().min(1).max(10).default(1),
  isVip: z.boolean().default(false),
})

export type CreateTableInput = z.infer<typeof createTableSchema>
