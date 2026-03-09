import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PlanGuard } from '../../common/guards/plan.guard'
import { RequiresPlan } from '../../common/decorators/requires-plan.decorator'
import type { DatingHelperService } from './dating-helper.service'
import { getSuggestionsSchema, type GetSuggestionsInput } from './dto'

@Controller('dating-helper')
@UseGuards(JwtAuthGuard, PlanGuard)
export class DatingHelperController {
  constructor(private readonly datingHelperService: DatingHelperService) {}

  @Post('suggestions')
  @RequiresPlan('platinum')
  async getSuggestions(@Req() req: { user: { id: string } }, @Body() body: GetSuggestionsInput) {
    const validated = getSuggestionsSchema.parse(body)
    return this.datingHelperService.getSuggestions(req.user.id, validated)
  }
}
