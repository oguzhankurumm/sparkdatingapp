import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { BadgesService } from './badges.service'

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  /**
   * GET /badges/definitions
   * All available badge definitions (public catalog).
   */
  @Get('definitions')
  getDefinitions() {
    return this.badgesService.getBadgeDefinitions()
  }

  /**
   * GET /badges/me
   * Current user's earned badges.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyBadges(@CurrentUser('id') userId: string) {
    return this.badgesService.getUserBadges(userId)
  }

  /**
   * PATCH /badges/:badgeId/display
   * Toggle badge display on/off.
   */
  @Patch(':badgeId/display')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async toggleDisplay(
    @CurrentUser('id') userId: string,
    @Param('badgeId') badgeId: string,
    @Body() body: { isDisplayed: boolean },
  ) {
    await this.badgesService.toggleDisplay(userId, badgeId, body.isDisplayed)
  }

  /**
   * POST /badges/streak
   * Record daily login — updates streak counters and awards milestones.
   */
  @Post('streak')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async recordLogin(@CurrentUser('id') userId: string) {
    return this.badgesService.recordLogin(userId)
  }
}
