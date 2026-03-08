import { Controller } from '@nestjs/common'
import type { ReferralsService } from './referrals.service'

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}
}
