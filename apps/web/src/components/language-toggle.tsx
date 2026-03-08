'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { type Locale, locales } from '@spark/i18n'
import { setLocale } from '@/actions/set-locale'
import { cn } from '@spark/ui'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  tr: 'TR',
}

export function LanguageToggle({ className }: { className?: string }) {
  const currentLocale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(locale: Locale) {
    if (locale === currentLocale) return
    startTransition(async () => {
      await setLocale(locale)
      router.refresh()
    })
  }

  return (
    <div
      className={cn(
        'bg-surface-elevated inline-flex items-center gap-0.5 rounded-full p-0.5',
        className,
      )}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(locale)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200',
            locale === currentLocale
              ? 'bg-primary text-text-inverse shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
            isPending && 'opacity-50',
          )}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  )
}
