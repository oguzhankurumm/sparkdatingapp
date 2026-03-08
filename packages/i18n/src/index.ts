// i18n configuration — next-intl message catalogs
export const locales = ['en', 'tr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const LOCALE_COOKIE_NAME = 'spark_locale'

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.includes(value as Locale)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Messages = Record<string, any>

const messageImports: Record<Locale, () => Promise<Messages>> = {
  en: () => import('./locales/en.json').then((m) => m.default),
  tr: () => import('./locales/tr.json').then((m) => m.default),
}

export async function getMessagesForLocale(locale: Locale): Promise<Messages> {
  const loader = messageImports[locale] ?? messageImports[defaultLocale]
  return loader()
}
