import { z } from 'zod'

export const notificationTypeValues = [
  'match',
  'message',
  'like',
  'super_like',
  'gift',
  'call_missed',
  'match_expiry',
  'boost_ended',
  'stream_started',
  'table_invite',
  'badge_earned',
  'referral_joined',
  'system',
] as const

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(notificationTypeValues),
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  data: z.record(z.unknown()).optional(),
  actorId: z.string().uuid().optional(),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
