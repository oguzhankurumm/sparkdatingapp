import { Controller, Get, Post, Body, Query, UseGuards, BadRequestException } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { GiftsService } from './gifts.service'
import type { GiftContext } from '@spark/types'

@Controller('gifts')
@UseGuards(JwtAuthGuard)
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  /** GET /gifts/types — list all active gift types */
  @Get('types')
  async listGiftTypes(@Query('category') category?: string) {
    return this.giftsService.listGiftTypes(category)
  }

  /** POST /gifts/send — send a gift to another user */
  @Post('send')
  async sendGift(
    @CurrentUser('id') senderId: string,
    @Body('recipientId') recipientId: string,
    @Body('giftTypeId') giftTypeId: string,
    @Body('context') context: GiftContext,
    @Body('contextReferenceId') contextReferenceId?: string,
  ) {
    if (!recipientId || !giftTypeId || !context) {
      throw new BadRequestException('recipientId, giftTypeId, and context are required')
    }

    const validContexts: GiftContext[] = ['chat', 'call', 'stream']
    if (!validContexts.includes(context)) {
      throw new BadRequestException('context must be one of: chat, call, stream')
    }

    return this.giftsService.sendGift(
      senderId,
      recipientId,
      giftTypeId,
      context,
      contextReferenceId,
    )
  }

  /** GET /gifts/history — get gift history for current user */
  @Get('history')
  async getGiftHistory(
    @CurrentUser('id') userId: string,
    @Query('direction') direction?: 'sent' | 'received' | 'all',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.giftsService.getGiftHistory(
      userId,
      direction ?? 'all',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    )
  }
}
