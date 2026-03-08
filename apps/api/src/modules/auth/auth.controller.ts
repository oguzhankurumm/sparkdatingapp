import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { loginSchema, registerSchema } from '@spark/validators'
import type { AuthService } from './auth.service'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { refreshTokenSchema } from './dto'
import type { LoginInput, RegisterInput, RefreshTokenInput } from '@spark/validators'
import type { User } from '../../database/schema'
import type { GoogleProfile } from './strategies/google.strategy'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Public — creates a new user account with email + password.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(@Body() body: RegisterInput, @Req() req: Request) {
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string | undefined,
      deviceType: req.headers['x-device-type'] as string | undefined,
    }

    const result = await this.authService.register(body, deviceInfo)
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }
  }

  /**
   * POST /auth/login
   * Public — authenticates with email + password.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginInput, @Req() req: Request) {
    const user = await this.authService.validateUser(body.email, body.password)
    if (!user) {
      return { message: 'Invalid credentials' }
    }

    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string | undefined,
      deviceType: req.headers['x-device-type'] as string | undefined,
    }

    const result = await this.authService.login(
      user as User & { id: string; email: string | null; role: string },
      deviceInfo,
    )
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
    }
  }

  /**
   * POST /auth/refresh
   * Public — exchanges a refresh token for a new access + refresh token pair.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  async refresh(@Body() body: RefreshTokenInput) {
    const tokens = await this.authService.refreshToken(body.refreshToken, body.deviceId)
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  /**
   * POST /auth/logout
   * Requires auth — deletes the user's session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const deviceId = req.headers['x-device-id'] as string | undefined
    await this.authService.logout(userId, deviceId)
    return { message: 'Logged out successfully' }
  }

  /**
   * GET /auth/google
   * Public — redirects to Google OAuth consent screen.
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard redirects to Google
  }

  /**
   * GET /auth/google/callback
   * Public — handles the Google OAuth callback.
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request) {
    const googleProfile = req.user as GoogleProfile
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceId: req.headers['x-device-id'] as string | undefined,
      deviceType: req.headers['x-device-type'] as string | undefined,
    }

    const result = await this.authService.googleLogin(googleProfile, deviceInfo)
    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      isNewUser: result.isNewUser,
    }
  }

  /**
   * GET /auth/me
   * Requires auth — returns the current authenticated user.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@CurrentUser() user: User) {
    const { passwordHash: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  }
}
