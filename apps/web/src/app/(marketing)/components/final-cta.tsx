'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { buttonVariants } from '@spark/ui'

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#0F0F0F] py-24 sm:py-32">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--primary)] opacity-[0.08] blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-[var(--secondary)] opacity-[0.08] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            Your next great connection
            <br />
            is one{' '}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
              Spark
            </span>{' '}
            away
          </h2>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/60">
            Join millions of people finding real connections through video, AI, and genuine
            conversation. Free to start, no credit card needed.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Create Your Profile
            </Link>
            <Link
              href="/login"
              className={
                buttonVariants({ variant: 'ghost', size: 'lg' }) +
                ' text-white/70 hover:bg-white/10 hover:text-white'
              }
            >
              I Have an Account
            </Link>
          </div>

          <p className="mt-8 text-xs text-white/40">
            Free forever for basic features · Premium from $11.99/mo · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
