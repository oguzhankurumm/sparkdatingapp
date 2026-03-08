import { Injectable } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { VerifyCallback } from 'passport-google-oauth20'
import { Strategy } from 'passport-google-oauth20'

export interface GoogleProfile {
  googleId: string
  email: string
  firstName: string
  avatarUrl: string | undefined
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: {
      id: string
      emails?: Array<{ value: string }>
      name?: { givenName?: string }
      photos?: Array<{ value: string }>
    },
    done: VerifyCallback,
  ) {
    const { id, emails, name, photos } = profile
    const user: GoogleProfile = {
      googleId: id,
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      avatarUrl: photos?.[0]?.value,
    }
    done(null, user)
  }
}
