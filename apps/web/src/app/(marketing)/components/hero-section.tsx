'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, VideoCamera, Users, ShieldCheck } from '@phosphor-icons/react'
import { buttonVariants, GradientText } from '@spark/ui'

const stats = [
  { value: '2M+', label: 'Connections Made' },
  { value: '150+', label: 'Countries' },
  { value: '4.8★', label: 'App Store' },
]

const floatingCards = [
  { name: 'Sophie', age: 26, rotate: -12, x: -40, y: 20, delay: 0 },
  { name: 'Alex', age: 28, rotate: 6, x: 20, y: -10, delay: 0.1 },
  { name: 'Mia', age: 24, rotate: -3, x: 0, y: 0, delay: 0.2 },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-24 sm:pt-36">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[var(--primary)] opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[var(--secondary)] opacity-[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="text-text-secondary">Now available worldwide</span>
            </motion.div>

            <h1 className="font-heading text-text-primary text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Dating that feels{' '}
              <GradientText gradient="brand" as="span" className="text-4xl sm:text-5xl lg:text-6xl">
                real
              </GradientText>
            </h1>

            <p className="text-text-secondary mx-auto mt-6 max-w-lg text-lg leading-relaxed lg:mx-0">
              Skip the endless swiping. Spark connects you through video calls, live tables, and
              AI-powered compatibility — so you find people who actually get you.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                Start for Free
              </Link>
              <a
                href="#how-it-works"
                className={buttonVariants({ variant: 'secondary', size: 'lg' })}
              >
                See How It Works
              </a>
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex items-center justify-center gap-2 lg:justify-start">
              <ShieldCheck size={16} weight="fill" className="text-text-muted" />
              <span className="text-text-muted text-xs">
                Verified profiles · End-to-end encrypted · No bots
              </span>
            </div>
          </motion.div>

          {/* Right — card stack illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative mx-auto flex h-[420px] w-full max-w-sm items-center justify-center lg:mx-0"
          >
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.name}
                initial={{ opacity: 0, y: 40, rotate: 0 }}
                animate={{
                  opacity: 1,
                  y: card.y,
                  x: card.x,
                  rotate: card.rotate,
                }}
                transition={{
                  delay: 0.5 + card.delay,
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute"
                style={{ zIndex: i + 1 }}
              >
                <div className="bg-surface h-[340px] w-[260px] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
                  {/* Placeholder gradient as profile photo */}
                  <div
                    className="h-[240px] w-full"
                    style={{
                      background:
                        i === 2
                          ? 'linear-gradient(135deg, #fda4af 0%, #c084fc 100%)'
                          : i === 1
                            ? 'linear-gradient(135deg, #93c5fd 0%, #a78bfa 100%)'
                            : 'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)',
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-text-primary font-semibold">
                        {card.name}, {card.age}
                      </span>
                      <ShieldCheck size={16} weight="fill" className="text-[var(--primary)]" />
                    </div>
                    <div className="text-text-muted mt-1 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart size={12} weight="fill" className="text-like" />
                        92% match
                      </span>
                      <span className="flex items-center gap-1">
                        <VideoCamera size={12} weight="fill" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Action buttons overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute -bottom-2 z-10 flex items-center gap-4"
            >
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform active:scale-95"
              >
                <X size={24} className="text-text-muted" />
              </button>
              <button
                type="button"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-lg transition-transform active:scale-95"
              >
                <Heart size={28} weight="fill" className="text-white" />
              </button>
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 transition-transform active:scale-95"
              >
                <Users size={24} className="text-[var(--secondary)]" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-surface/60 mt-16 flex justify-center gap-8 rounded-2xl border border-[var(--border)] p-6 backdrop-blur-sm sm:gap-16 sm:p-8"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-heading text-text-primary text-2xl font-bold sm:text-3xl">
                {stat.value}
              </div>
              <div className="text-text-muted mt-1 text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function X({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
