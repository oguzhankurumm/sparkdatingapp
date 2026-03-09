import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

export interface GiphyGif {
  id: string
  url: string
  previewUrl: string
  width: number
  height: number
  title: string
}

interface GiphyApiImage {
  url: string
  width: string
  height: string
}

interface GiphyApiResult {
  id: string
  title: string
  images: {
    fixed_height: GiphyApiImage
    fixed_height_still: GiphyApiImage
    original: GiphyApiImage
  }
}

interface GiphyApiResponse {
  data: GiphyApiResult[]
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

@Injectable()
export class GiphyService {
  private readonly logger = new Logger(GiphyService.name)
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.giphy.com/v1/gifs'

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GIPHY_API_KEY', '')
  }

  /**
   * Search GIFs by query string.
   */
  async search(query: string, limit?: number, offset?: number): Promise<GiphyGif[]> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      q: query,
      limit: String(Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT)),
      offset: String(offset ?? 0),
      rating: 'pg-13',
      lang: 'en',
    })

    return this.fetchGifs(`${this.baseUrl}/search?${params}`)
  }

  /**
   * Get trending GIFs.
   */
  async trending(limit?: number, offset?: number): Promise<GiphyGif[]> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      limit: String(Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT)),
      offset: String(offset ?? 0),
      rating: 'pg-13',
    })

    return this.fetchGifs(`${this.baseUrl}/trending?${params}`)
  }

  private async fetchGifs(url: string): Promise<GiphyGif[]> {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        this.logger.error(`GIPHY API error: ${response.status} ${response.statusText}`)
        return []
      }

      const json = (await response.json()) as GiphyApiResponse

      return json.data.map((gif) => this.mapGif(gif))
    } catch (error) {
      this.logger.error('Failed to fetch from GIPHY', error)
      return []
    }
  }

  private mapGif(gif: GiphyApiResult): GiphyGif {
    const img = gif.images.fixed_height
    const preview = gif.images.fixed_height_still

    return {
      id: gif.id,
      url: img.url,
      previewUrl: preview.url,
      width: parseInt(img.width, 10),
      height: parseInt(img.height, 10),
      title: gif.title,
    }
  }
}
