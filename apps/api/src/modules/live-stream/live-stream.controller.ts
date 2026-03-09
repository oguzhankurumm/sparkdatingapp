import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common'
import type { LiveStreamService } from './live-stream.service'
import type {
  StreamListing,
  StreamDetail,
  StartStreamResponse,
  EndStreamResponse,
  JoinStreamResponse,
  StreamCategory,
} from '@spark/types'

@Controller('streams')
export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) {}

  /** Start a new live stream */
  @Post('start')
  async startStream(
    @Req() req: { user: { sub: string } },
    @Body() body: { title: string; category?: StreamCategory },
  ): Promise<StartStreamResponse> {
    return this.liveStreamService.startStream(req.user.sub, body.title, body.category)
  }

  /** End an active stream */
  @Post(':id/end')
  async endStream(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<EndStreamResponse> {
    return this.liveStreamService.endStream(id, req.user.sub)
  }

  /** List active streams (for discover feed) */
  @Get('active')
  async getActiveStreams(): Promise<StreamListing[]> {
    return this.liveStreamService.getActiveStreams()
  }

  /** Get stream detail */
  @Get(':id')
  async getStreamDetail(@Param('id') id: string): Promise<StreamDetail> {
    return this.liveStreamService.getStreamDetail(id)
  }

  /** Join stream as viewer */
  @Post(':id/join')
  async joinStream(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ): Promise<JoinStreamResponse> {
    return this.liveStreamService.joinStream(id, req.user.sub)
  }
}
