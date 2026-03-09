import { Controller, Get, Query, BadRequestException } from '@nestjs/common'
import type { GiphyService } from './giphy.service'

@Controller('giphy')
export class GiphyController {
  constructor(private readonly giphyService: GiphyService) {}

  /**
   * GET /api/giphy/search?q=happy&limit=20&offset=0
   * Search GIFs via server-side GIPHY proxy.
   */
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required')
    }

    const gifs = await this.giphyService.search(
      query.trim(),
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    )

    return { gifs }
  }

  /**
   * GET /api/giphy/trending?limit=20&offset=0
   * Get trending GIFs via server-side GIPHY proxy.
   */
  @Get('trending')
  async trending(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const gifs = await this.giphyService.trending(
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    )

    return { gifs }
  }
}
