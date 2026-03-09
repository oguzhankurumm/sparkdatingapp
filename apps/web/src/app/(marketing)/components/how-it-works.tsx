'use client'

import { motion } from 'framer-motion'
import { UserPlus, Swatches, VideoCamera } from '@phosphor-icons/react'
import { GradientText } from '@spark/ui'

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Create Your Profile',
    description:
      'Add your best photos, pick your interests, and let our AI suggest the perfect bio. Verify with a selfie to earn your trust badge.',
  },
  {
    icon: Swatches,
    number: '02',
    title: 'Discover Your Way',
    description:
      'Swipe through curated matches, browse trending profiles, or join a live table to meet multiple people at once. You pick the vibe.',
  },
  {
    icon: VideoCamera,
    number: '03',
    title: 'Connect for Real',
    description:
      'Skip the small talk. Jump on a video call, use AI icebreakers, or plan a date with our Date Planner. Real connections, faster.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-text-muted text-sm font-medium uppercase tracking-wide">
            Simple & Fast
          </p>
          <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
            How{' '}
            <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
              Spark
            </GradientText>{' '}
            Works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 sm:mt-20 md:grid-cols-3 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative text-center"
            >
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+40px)] top-10 hidden h-px w-[calc(100%-80px)] bg-gradient-to-r from-[var(--border)] to-transparent md:block" />
              )}

              <div className="bg-surface mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5">
                <step.icon size={32} weight="duotone" className="text-[var(--primary)]" />
              </div>

              <span className="text-text-muted mt-4 block text-xs font-semibold uppercase tracking-widest">
                Step {step.number}
              </span>

              <h3 className="font-heading text-text-primary mt-2 text-lg font-bold">
                {step.title}
              </h3>

              <p className="text-text-secondary mt-2 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
