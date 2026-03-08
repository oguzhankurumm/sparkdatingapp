import { z } from 'zod'

export const sendMessageSchema = z
  .object({
    type: z.enum(['text', 'image', 'gif', 'voice', 'gift', 'system']).default('text'),
    content: z.string().max(5000).optional(),
    mediaUrl: z.string().url().optional(),
  })
  .refine(
    (data) => {
      // Text messages require content
      if (data.type === 'text' && !data.content) {
        return false
      }
      // Media messages require mediaUrl
      if (['image', 'gif', 'voice'].includes(data.type) && !data.mediaUrl) {
        return false
      }
      return true
    },
    {
      message: 'Text messages require content; image/gif/voice messages require mediaUrl',
    },
  )

export type SendMessageInput = z.infer<typeof sendMessageSchema>
