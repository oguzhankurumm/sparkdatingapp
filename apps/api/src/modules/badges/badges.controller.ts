import { Controller } from '@nestjs/common'
import type { BadgesService } from './badges.service'

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}
}
