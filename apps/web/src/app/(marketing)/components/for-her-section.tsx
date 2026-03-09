'use client'

import { motion } from 'framer-motion'
import { Crown, ShieldCheck, ChatCircleDots } from '@phosphor-icons/react'
import { GradientText } from '@spark/ui'

const perks = [
  {
    icon: Crown,
    title: 'Premium for Free',
    description:
      'Unlimited likes, see who liked you, rewinds, advanced filters, read receipts, and a weekly boost — all free, always.',
  },
  {
    icon: ShieldCheck,
    title: 'Safer by Design',
    description:
      "Photo verification, panic button, video-first dates so you know who you're meeting, and 24/7 AI moderation.",
  },
  {
    icon: ChatCircleDots,
    title: 'Quality Conversations',
    description:
      'AI icebreakers replace "hey" with real conversation starters. Smart prompts keep things interesting and respectful.',
  },
]

export function ForHerSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-purple-50/50 to-transparent dark:from-rose-950/20 dark:via-purple-950/10 dark:to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — visual */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto flex h-[380px] w-full max-w-sm items-center justify-center lg:mx-0"
          >
            {/* Phone mockup */}
            <div className="bg-surface h-[360px] w-[200px] overflow-hidden rounded-[32px] shadow-xl ring-1 ring-black/5">
              <div className="flex h-full flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-center px-4 py-3">
                  <div className="h-5 w-20 rounded-full bg-black/80" />
                </div>
                {/* Screen content */}
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                    <Crown size={28} weight="fill" className="text-white" />
                  </div>
                  <span className="font-heading text-text-primary text-sm font-bold">
                    Premium Unlocked
                  </span>
                  <span className="text-text-muted text-center text-[11px]">
                    All features free for women
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {['Unlimited Likes', 'See Who Likes You', 'Weekly Boost'].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[11px]">
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                        <span className="text-text-secondary">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="bg-surface absolute -right-4 top-12 rounded-xl p-3 shadow-lg ring-1 ring-black/5"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} weight="fill" className="text-[var(--primary)]" />
                <span className="text-text-primary text-xs font-semibold">Verified</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — copy */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-text-muted text-sm font-medium uppercase tracking-wide">
              Women-First
            </p>
            <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
              Built{' '}
              <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
                for her
              </GradientText>
            </h2>
            <p className="text-text-secondary mt-4 text-base leading-relaxed">
              Women get premium features for free — because great dating starts with making women
              feel safe, valued, and in control.
            </p>

            <div className="mt-8 space-y-6">
              {perks.map((perk, i) => (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="flex gap-4"
                >
                  <div className="bg-[var(--primary)]/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                    <perk.icon size={20} weight="duotone" className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="text-text-primary text-sm font-semibold">{perk.title}</h3>
                    <p className="text-text-secondary mt-1 text-sm leading-relaxed">
                      {perk.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
