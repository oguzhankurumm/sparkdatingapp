import { z } from 'zod'

const gifMetadataSchema = z.object({
  giphyId: z.string(),
  giphyUrl: z.string().url(),
  giphyPreview: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const sendMessageSchema = z
  .object({
    type: z.enum(['text', 'image', 'gif', 'voice', 'gift', 'system']).default('text'),
    content: z.string().max(5000).optional(),
    mediaUrl: z.string().url().optional(),
    metadata: z
      .object({
        gif: gifMetadataSchema.optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Text messages require content
      if (data.type === 'text' && !data.content) {
        return false
      }
      // Media messages require mediaUrl
      if (['image', 'voice'].includes(data.type) && !data.mediaUrl) {
        return false
      }
      // GIF messages require gif metadata
      if (data.type === 'gif' && !data.metadata?.gif) {
        return false
      }
      return true
    },
    {
      message:
        'Text messages require content; image/voice messages require mediaUrl; gif messages require metadata.gif',
    },
  )

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type GifMetadata = z.infer<typeof gifMetadataSchema>
