import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, isValidLocale, getMessagesForLocale, LOCALE_COOKIE_NAME } from '@spark/i18n'

export default getRequestConfig(async () => {
  // Priority:
  // 1. spark_locale cookie (user manually selected)
  // 2. Accept-Language header (browser language)
  // 3. defaultLocale: 'en'

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value

  if (isValidLocale(cookieLocale)) {
    return {
      locale: cookieLocale,
      messages: await getMessagesForLocale(cookieLocale),
    }
  }

  // Parse Accept-Language for 'tr' support
  const headerStore = await headers()
  const acceptLanguage = headerStore.get('accept-language') ?? ''
  const browserLocale = acceptLanguage.includes('tr') ? 'tr' : defaultLocale

  return {
    locale: browserLocale,
    messages: await getMessagesForLocale(browserLocale),
  }
})
