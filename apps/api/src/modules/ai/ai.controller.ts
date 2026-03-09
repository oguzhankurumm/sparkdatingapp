import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators'
import type { IcebreakerService } from './icebreaker.service'
import { icebreakerSchema } from './dto'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly icebreakerService: IcebreakerService) {}

  @Post('icebreaker')
  async getIcebreakers(@CurrentUser('id') userId: string, @Body() body: { matchId: string }) {
    const { matchId } = icebreakerSchema.parse(body)
    return this.icebreakerService.generateIcebreakers(userId, matchId)
  }
}
