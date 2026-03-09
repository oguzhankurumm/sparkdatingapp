import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { CurrentUser } from '../../common/decorators'
import type { UsersService } from './users.service'
import type { ZodiacService, ZodiacSign } from '../zodiac/zodiac.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly zodiacService: ZodiacService,
  ) {}

  /** Get zodiac compatibility between the current user and a target user */
  @Get(':id/compatibility')
  async getCompatibility(
    @CurrentUser('id') currentUserId: string,
    @Param('id') targetUserId: string,
  ) {
    const [currentUser, targetUser] = await Promise.all([
      this.usersService.findById(currentUserId),
      this.usersService.findById(targetUserId),
    ])

    if (!targetUser) {
      throw new NotFoundException('User not found')
    }

    const signA = currentUser?.zodiacSign as ZodiacSign | null
    const signB = targetUser.zodiacSign as ZodiacSign | null

    if (!signA || !signB) {
      throw new BadRequestException('Both users must have a zodiac sign set')
    }

    return this.zodiacService.getCompatibility(signA, signB)
  }

  // ── Voice Note Profile ──────────────────────────────────

  /** POST /api/users/voice-note/upload-url — get presigned upload URL */
  @Post('voice-note/upload-url')
  async getVoiceNoteUploadUrl(@CurrentUser('id') userId: string) {
    return this.usersService.getVoiceNoteUploadUrl(userId)
  }

  /** POST /api/users/voice-note — save voice note metadata after upload */
  @Post('voice-note')
  async saveVoiceNote(
    @CurrentUser('id') userId: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('duration') duration: number,
  ) {
    if (!mediaUrl || !duration) {
      throw new BadRequestException('mediaUrl and duration are required')
    }
    await this.usersService.saveVoiceNote(userId, mediaUrl, duration)
    return { success: true }
  }

  /** DELETE /api/users/voice-note — remove voice note */
  @Delete('voice-note')
  async removeVoiceNote(@CurrentUser('id') userId: string) {
    await this.usersService.removeVoiceNote(userId)
    return { success: true }
  }
}
