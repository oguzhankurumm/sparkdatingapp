import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import type { ConfigService } from '@nestjs/config'
import { eq, and } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import * as Sentry from '@sentry/node'
import { DATABASE, type Database } from '../../database/database.module'
import { users, userSessions, wallets, walletTransactions, type User } from '../../database/schema'
import type { UsersService } from '../users/users.service'
import type { JwtPayload } from './strategies/jwt.strategy'
import type { GoogleProfile } from './strategies/google.strategy'
import type { RegisterInput } from '@spark/validators'

const SALT_ROUNDS = 12
const SIGNUP_BONUS_TOKENS = 1000
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_DAYS = 30

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface DeviceInfo {
  deviceType?: string
  deviceId?: string
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validate user credentials for local (email+password) login.
   * Returns user without passwordHash if valid, null otherwise.
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await this.usersService.findByEmail(email)
      if (!user || !user.passwordHash) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return null
      }

      if (user.isBanned) {
        throw new UnauthorizedException('Account is banned')
      }

      if (user.deletedAt) {
        throw new UnauthorizedException('Account has been deleted')
      }

      const { passwordHash: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Error validating user', error)
      return null
    }
  }

  /**
   * Register a new user with email + password.
   * Creates user, wallet with signup bonus (1000 tokens), and session in a single transaction.
   */
  async register(
    input: RegisterInput,
    deviceInfo: DeviceInfo = {},
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens }> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(input.email)
    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    try {
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

      const newUser = await this.db.transaction(async (tx) => {
        // 1. Create user
        const [createdUser] = await tx
          .insert(users)
          .values({
            email: input.email,
            passwordHash,
            firstName: input.name,
            birthday: input.birthDate,
            gender: input.gender,
          })
          .returning()

        if (!createdUser) {
          throw new Error('Failed to create user')
        }

        // 2. Create wallet with signup bonus
        const [wallet] = await tx
          .insert(wallets)
          .values({
            userId: createdUser.id,
            balance: SIGNUP_BONUS_TOKENS,
            totalEarned: SIGNUP_BONUS_TOKENS,
          })
          .returning()

        if (!wallet) {
          throw new Error('Failed to create wallet')
        }

        // 3. Record signup bonus transaction
        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          type: 'signup_bonus',
          amount: SIGNUP_BONUS_TOKENS,
          balanceAfter: SIGNUP_BONUS_TOKENS,
          description: 'Welcome signup bonus',
        })

        return createdUser
      })

      // Generate tokens and create session (outside main transaction for clarity)
      const tokens = await this.generateTokens(newUser)
      await this.createSession(newUser.id, tokens.refreshToken, deviceInfo)

      const { passwordHash: _, ...userWithoutPassword } = newUser
      return { user: userWithoutPassword, tokens }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Error during registration', error)
      throw error
    }
  }

  /**
   * Login an already-validated user. Creates session, returns tokens.
   */
  async login(
    user: Omit<User, 'passwordHash'> & { id: string; email: string | null; role: string },
    deviceInfo: DeviceInfo = {},
  ): Promise<{ user: typeof user; tokens: AuthTokens }> {
    try {
      const tokens = await this.generateTokens(user)
      await this.createSession(user.id, tokens.refreshToken, deviceInfo)
      return { user, tokens }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error during login', error)
      throw error
    }
  }

  /**
   * Refresh access + refresh token pair.
   * Validates the existing refresh token from userSessions, issues a new pair,
   * and replaces the session record.
   */
  async refreshToken(refreshToken: string, _deviceId?: string): Promise<AuthTokens> {
    try {
      // Find the session with this refresh token
      const [session] = await this.db
        .select()
        .from(userSessions)
        .where(eq(userSessions.refreshToken, refreshToken))
        .limit(1)

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token')
      }

      // Check expiry
      if (new Date() > session.expiresAt) {
        // Clean up expired session
        await this.db.delete(userSessions).where(eq(userSessions.id, session.id))
        throw new UnauthorizedException('Refresh token expired')
      }

      // Validate that the user still exists and is not banned
      const user = await this.usersService.findById(session.userId)
      if (!user || user.isBanned || user.deletedAt) {
        await this.db.delete(userSessions).where(eq(userSessions.id, session.id))
        throw new UnauthorizedException('User account unavailable')
      }

      // Generate new token pair
      const tokens = await this.generateTokens(user)

      // Update the session with the new refresh token
      const refreshExpiresAt = new Date()
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

      await this.db
        .update(userSessions)
        .set({
          refreshToken: tokens.refreshToken,
          expiresAt: refreshExpiresAt,
        })
        .where(eq(userSessions.id, session.id))

      return tokens
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Error refreshing token', error)
      throw error
    }
  }

  /**
   * Logout — delete the user's session for the given device.
   * If no deviceId, deletes all sessions for the user.
   */
  async logout(userId: string, deviceId?: string): Promise<void> {
    try {
      if (deviceId) {
        await this.db
          .delete(userSessions)
          .where(and(eq(userSessions.userId, userId), eq(userSessions.deviceId, deviceId)))
      } else {
        await this.db.delete(userSessions).where(eq(userSessions.userId, userId))
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Error during logout', error)
      throw error
    }
  }

  /**
   * Handle Google OAuth login/signup.
   * Finds existing user by googleId or creates a new one with wallet + signup bonus.
   */
  async googleLogin(
    googleProfile: GoogleProfile,
    deviceInfo: DeviceInfo = {},
  ): Promise<{ user: Omit<User, 'passwordHash'>; tokens: AuthTokens; isNewUser: boolean }> {
    try {
      // Check if user already exists by googleId
      let user = await this.usersService.findByGoogleId(googleProfile.googleId)
      let isNewUser = false

      if (!user) {
        // Check if a user with the same email already exists
        if (googleProfile.email) {
          const existingEmailUser = await this.usersService.findByEmail(googleProfile.email)
          if (existingEmailUser) {
            // Link Google account to existing user
            await this.db
              .update(users)
              .set({
                googleId: googleProfile.googleId,
                avatarUrl: existingEmailUser.avatarUrl || googleProfile.avatarUrl,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingEmailUser.id))

            user = await this.usersService.findById(existingEmailUser.id)
          }
        }

        if (!user) {
          // Create new user with Google profile inside a transaction (wallet + bonus)
          const newUser = await this.db.transaction(async (tx) => {
            const [createdUser] = await tx
              .insert(users)
              .values({
                email: googleProfile.email || undefined,
                googleId: googleProfile.googleId,
                firstName: googleProfile.firstName || 'User',
                birthday: '2000-01-01', // Placeholder — will be set during onboarding
                gender: 'male', // Placeholder — will be set during onboarding
                avatarUrl: googleProfile.avatarUrl,
              })
              .returning()

            if (!createdUser) {
              throw new Error('Failed to create user')
            }

            const [wallet] = await tx
              .insert(wallets)
              .values({
                userId: createdUser.id,
                balance: SIGNUP_BONUS_TOKENS,
                totalEarned: SIGNUP_BONUS_TOKENS,
              })
              .returning()

            if (!wallet) {
              throw new Error('Failed to create wallet')
            }

            await tx.insert(walletTransactions).values({
              walletId: wallet.id,
              type: 'signup_bonus',
              amount: SIGNUP_BONUS_TOKENS,
              balanceAfter: SIGNUP_BONUS_TOKENS,
              description: 'Welcome signup bonus',
            })

            return createdUser
          })

          user = newUser
          isNewUser = true
        }
      }

      if (!user) {
        throw new UnauthorizedException('Failed to authenticate with Google')
      }

      if (user.isBanned) {
        throw new UnauthorizedException('Account is banned')
      }

      const tokens = await this.generateTokens(user)
      await this.createSession(user.id, tokens.refreshToken, deviceInfo)

      const { passwordHash: _, ...userWithoutPassword } = user
      return { user: userWithoutPassword, tokens, isNewUser }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      Sentry.captureException(error)
      this.logger.error('Error during Google login', error)
      throw error
    }
  }

  /**
   * Generate access + refresh token pair for a user.
   */
  private async generateTokens(user: Pick<User, 'id' | 'email' | 'role'>): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      }),
    ])

    return { accessToken, refreshToken }
  }

  /**
   * Create a session record in userSessions.
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)

    await this.db.insert(userSessions).values({
      userId,
      refreshToken,
      deviceType: deviceInfo.deviceType,
      deviceId: deviceInfo.deviceId,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      expiresAt,
    })
  }
}
