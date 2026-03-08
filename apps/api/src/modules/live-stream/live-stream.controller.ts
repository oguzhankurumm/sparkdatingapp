import { Controller } from '@nestjs/common'
import type { LiveStreamService } from './live-stream.service'

@Controller('live-stream')
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}
}
