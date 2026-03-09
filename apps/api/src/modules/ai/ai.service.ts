import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly client: Anthropic

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    })
  }

  /**
   * Generate a JSON response from Claude.
   * Parses the text block content as JSON automatically.
   */
  async generateJson<T = unknown>(opts: {
    model?: string
    system?: string
    prompt: string
    maxTokens?: number
  }): Promise<T> {
    const model = opts.model ?? 'claude-haiku-4-5-20251001'
    const maxTokens = opts.maxTokens ?? 512

    this.logger.debug(`AI request → model=${model}, maxTokens=${maxTokens}`)

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system,
      messages: [{ role: 'user', content: opts.prompt }],
    })

    // Extract text from the first text block
    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text block in AI response')
    }

    // Parse JSON — handle markdown code fences if present
    let raw = textBlock.text.trim()
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    return JSON.parse(raw) as T
  }
}
