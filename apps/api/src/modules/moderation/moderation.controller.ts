import { Controller } from '@nestjs/common'
import type { ModerationService } from './moderation.service'

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}
}
