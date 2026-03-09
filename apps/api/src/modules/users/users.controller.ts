import { Controller, Get, Param, NotFoundException, BadRequestException } from '@nestjs/common'
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
}
