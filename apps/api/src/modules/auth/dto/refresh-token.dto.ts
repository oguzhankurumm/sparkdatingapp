import { z } from 'zod'

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().optional(),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
