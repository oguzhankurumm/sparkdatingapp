import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'

export interface TranslateResult {
  translatedText: string
  detectedSourceLang: string
  targetLang: string
}

export interface DetectResult {
  language: string
  confidence: number
}

interface DeepLTranslation {
  detected_source_language: string
  text: string
}

interface DeepLResponse {
  translations: DeepLTranslation[]
}

// DeepL supported source languages
const SUPPORTED_LANGS = new Set([
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'et',
  'fi',
  'fr',
  'hu',
  'id',
  'it',
  'ja',
  'ko',
  'lt',
  'lv',
  'nb',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'tr',
  'uk',
  'zh',
])

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name)
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('DEEPL_API_KEY', '')
    // DeepL Free API uses api-free.deepl.com, Pro uses api.deepl.com
    const isFree = this.apiKey.endsWith(':fx')
    this.baseUrl = isFree ? 'https://api-free.deepl.com/v2' : 'https://api.deepl.com/v2'
  }

  /**
   * Translate text from one language to another using DeepL.
   * If sourceLang is not provided, DeepL will auto-detect it.
   */
  async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslateResult> {
    if (!this.apiKey) {
      this.logger.warn('DeepL API key not configured — returning original text')
      return {
        translatedText: text,
        detectedSourceLang: sourceLang ?? 'unknown',
        targetLang,
      }
    }

    // DeepL uses uppercase for target lang, and EN-US / EN-GB / PT-BR / PT-PT
    const normalizedTarget = this.normalizeTargetLang(targetLang)

    const params = new URLSearchParams({
      text,
      target_lang: normalizedTarget,
    })

    if (sourceLang) {
      params.set('source_lang', sourceLang.toUpperCase())
    }

    try {
      const response = await fetch(`${this.baseUrl}/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        this.logger.error(`DeepL API error: ${response.status} — ${errorBody}`)
        throw new Error(`DeepL API error: ${response.status}`)
      }

      const data = (await response.json()) as DeepLResponse
      const translation = data.translations[0]

      if (!translation) {
        throw new Error('No translation returned from DeepL')
      }

      return {
        translatedText: translation.text,
        detectedSourceLang: translation.detected_source_language.toLowerCase(),
        targetLang: targetLang.toLowerCase(),
      }
    } catch (error) {
      this.logger.error('Translation failed', error)
      throw error
    }
  }

  /**
   * Detect the language of a text string using DeepL's translate endpoint.
   * DeepL doesn't have a dedicated detect endpoint, so we translate a small
   * portion to EN and read the detected_source_language.
   */
  async detectLanguage(text: string): Promise<DetectResult> {
    if (!this.apiKey) {
      return { language: 'unknown', confidence: 0 }
    }

    // Use first 100 chars for detection to save API quota
    const sample = text.slice(0, 100)

    try {
      const result = await this.translate(sample, 'en')
      return {
        language: result.detectedSourceLang,
        confidence: 1, // DeepL doesn't expose confidence
      }
    } catch {
      return { language: 'unknown', confidence: 0 }
    }
  }

  /**
   * Check if two language codes represent the same language.
   * Handles variants like en-US vs en, pt-BR vs pt, etc.
   */
  isSameLanguage(langA: string, langB: string): boolean {
    const baseA = langA.toLowerCase().split('-')[0] ?? langA
    const baseB = langB.toLowerCase().split('-')[0] ?? langB
    return baseA === baseB
  }

  /**
   * Check if a language is supported by DeepL.
   */
  isSupported(lang: string): boolean {
    const base = lang.toLowerCase().split('-')[0] ?? lang
    return SUPPORTED_LANGS.has(base)
  }

  /**
   * Normalize target language code for DeepL API.
   * DeepL requires uppercase and specific variants for EN and PT.
   */
  private normalizeTargetLang(lang: string): string {
    const upper = lang.toUpperCase()
    // DeepL requires EN-US or EN-GB, not just EN
    if (upper === 'EN') return 'EN-US'
    if (upper === 'PT') return 'PT-BR'
    return upper
  }
}
