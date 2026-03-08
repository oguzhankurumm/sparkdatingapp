'use server'

import { cookies } from 'next/headers'
import { type Locale, isValidLocale, LOCALE_COOKIE_NAME } from '@spark/i18n'

export async function setLocale(locale: Locale) {
  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale: ${locale}`)
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    secure: globalThis.process?.env?.NODE_ENV === 'production',
  })
}
