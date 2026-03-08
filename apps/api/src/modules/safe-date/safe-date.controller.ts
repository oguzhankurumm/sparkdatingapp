import { Controller } from '@nestjs/common'
import type { SafeDateService } from './safe-date.service'

@Controller('safe-date')
export class SafeDateController {
  constructor(private readonly safeDateService: SafeDateService) {}
}
