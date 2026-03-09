import { Controller, Get, Post, Delete, Param, Body, Req } from '@nestjs/common'
import type { StoriesService } from './stories.service'
import type {
  StoryItem,
  StoryFeedUser,
  StoryUploadUrlResponse,
  CreateStoryResponse,
  StoryMediaType,
} from '@spark/types'

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /** Get a presigned S3 upload URL for story media */
  @Post('upload-url')
  async getUploadUrl(
    @Req() req: { user: { sub: string } },
    @Body() body: { mediaType: StoryMediaType },
  ): Promise<StoryUploadUrlResponse> {
    return this.storiesService.getUploadUrl(req.user.sub, body.mediaType)
  }

  /** Create a new story (after media is uploaded to S3) */
  @Post()
  async createStory(
    @Req() req: { user: { sub: string } },
    @Body() body: { mediaUrl: string; mediaType: StoryMediaType; caption?: string },
  ): Promise<CreateStoryResponse> {
    return this.storiesService.createStory(
      req.user.sub,
      body.mediaUrl,
      body.mediaType,
      body.caption,
    )
  }

  /** Get story feed — matched users' active stories */
  @Get('feed')
  async getStoryFeed(@Req() req: { user: { sub: string } }): Promise<StoryFeedUser[]> {
    return this.storiesService.getStoryFeed(req.user.sub)
  }

  /** Get a specific user's active stories */
  @Get('user/:userId')
  async getUserStories(
    @Req() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ): Promise<StoryItem[]> {
    return this.storiesService.getUserStories(userId, req.user.sub)
  }

  /** Mark a story as viewed */
  @Post(':id/view')
  async markViewed(@Req() req: { user: { sub: string } }, @Param('id') id: string): Promise<void> {
    return this.storiesService.markViewed(id, req.user.sub)
  }

  /** Delete own story */
  @Delete(':id')
  async deleteStory(@Req() req: { user: { sub: string } }, @Param('id') id: string): Promise<void> {
    return this.storiesService.deleteStory(id, req.user.sub)
  }
}
