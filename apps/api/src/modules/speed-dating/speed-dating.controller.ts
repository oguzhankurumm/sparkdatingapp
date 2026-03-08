import { Controller } from '@nestjs/common'
import type { SpeedDatingService } from './speed-dating.service'

@Controller('speed-dating')
export class SpeedDatingController {
  constructor(private readonly speedDatingService: SpeedDatingService) {}
}
