import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/lib/query-provider'
import { CookieConsent } from '@/components/cookie-consent'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'Spark — Dating Reimagined',
    template: '%s | Spark',
  },
  description:
    'Meet, match, video call, and go live. Spark combines the best of modern dating with real-time connection.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Spark',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Spark',
    title: 'Spark — Dating Reimagined',
    description:
      'Meet, match, video call, and go live. Spark combines the best of modern dating with real-time connection.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spark — Dating Reimagined',
    description:
      'Meet, match, video call, and go live. Spark combines the best of modern dating with real-time connection.',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-text-primary font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
              <CookieConsent />
            </NextIntlClientProvider>
          </QueryProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
