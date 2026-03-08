// Shared Zod validation schemas — used in both client and server
// Schemas will be added as features are built

export {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  type LoginInput,
  type RegisterInput,
  type RefreshTokenInput,
} from './auth'
