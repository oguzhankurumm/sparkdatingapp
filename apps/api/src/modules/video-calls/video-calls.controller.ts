import { Controller } from '@nestjs/common'
import type { VideoCallsService } from './video-calls.service'

@Controller('video-calls')
export class VideoCallsController {
  constructor(private readonly videoCallsService: VideoCallsService) {}
}
