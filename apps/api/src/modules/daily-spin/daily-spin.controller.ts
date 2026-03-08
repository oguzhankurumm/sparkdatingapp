import { Controller } from '@nestjs/common'
import type { DailySpinService } from './daily-spin.service'

@Controller('daily-spin')
export class DailySpinController {
  constructor(private readonly dailySpinService: DailySpinService) {}
}
