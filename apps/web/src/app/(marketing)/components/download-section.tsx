'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { DeviceMobile, Globe } from '@phosphor-icons/react'
import { Button, buttonVariants, GradientText } from '@spark/ui'

export function DownloadSection() {
  return (
    <section className="bg-surface-elevated/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-text-muted text-sm font-medium uppercase tracking-wide">
              Available Now
            </p>
            <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
              Start on{' '}
              <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
                web
              </GradientText>
              , take it anywhere
            </h2>
            <p className="text-text-secondary mt-4 text-base leading-relaxed">
              Spark works beautifully in your browser — no download needed. Mobile apps are coming
              soon for iOS and Android.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={buttonVariants({ variant: 'primary', size: 'lg' }) + ' gap-2'}
              >
                <Globe size={20} weight="bold" />
                Open Web App
              </Link>
              <Button variant="secondary" size="lg" disabled className="gap-2">
                <DeviceMobile size={20} weight="bold" />
                Mobile — Coming Soon
              </Button>
            </div>

            <div className="text-text-muted mt-6 flex items-center gap-4 text-xs">
              <span>Works on Chrome, Safari, Firefox</span>
              <span className="text-border">·</span>
              <span>PWA installable</span>
            </div>
          </motion.div>

          {/* Right — phone illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative mx-auto flex items-center justify-center lg:mx-0"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="bg-surface h-[400px] w-[200px] overflow-hidden rounded-[32px] shadow-2xl ring-1 ring-black/10">
                <div className="flex h-full flex-col">
                  {/* Notch */}
                  <div className="flex items-center justify-center px-4 py-3">
                    <div className="h-5 w-20 rounded-full bg-black/80" />
                  </div>
                  {/* App screen simulation */}
                  <div className="flex flex-1 flex-col gap-3 p-3">
                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                      <div className="bg-[var(--primary)]/20 h-3 w-16 rounded" />
                      <div className="bg-[var(--primary)]/20 h-6 w-6 rounded-full" />
                    </div>
                    {/* Card */}
                    <div className="flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-200 to-purple-200">
                      <div className="flex h-full flex-col justify-end p-3">
                        <div className="h-3 w-20 rounded bg-white/60" />
                        <div className="mt-1.5 h-2 w-14 rounded bg-white/40" />
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="bg-surface absolute -right-8 top-20 rounded-xl p-3 shadow-lg ring-1 ring-black/5"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-[var(--like)]/10 flex h-8 w-8 items-center justify-center rounded-full">
                    <span className="text-sm">💘</span>
                  </div>
                  <div>
                    <p className="text-text-primary text-[11px] font-semibold">New Match!</p>
                    <p className="text-text-muted text-[10px]">Start chatting now</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
