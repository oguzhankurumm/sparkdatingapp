import { Controller, Post, Body, Req, UseGuards, UsePipes } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import type { IcebreakerService } from './icebreaker.service'
import { generateIcebreakerSchema, type GenerateIcebreakerDto } from './dto'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class IcebreakerController {
  constructor(private readonly icebreakerService: IcebreakerService) {}

  @Post('icebreaker')
  @UsePipes(new ZodValidationPipe(generateIcebreakerSchema))
  async generateIcebreaker(
    @Body() dto: GenerateIcebreakerDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.icebreakerService.generateIcebreakers(dto.matchId, req.user.id)
  }
}
