'use client'

import { motion } from 'framer-motion'
import { VideoCamera, Users, Brain, Lightning } from '@phosphor-icons/react'
import { GradientText } from '@spark/ui'

const features = [
  {
    icon: VideoCamera,
    title: 'Video Dates',
    description:
      'See if the chemistry is real before meeting up. One tap to start a video call with your match — no phone number needed.',
    color: 'var(--primary)',
  },
  {
    icon: Users,
    title: 'Live Tables',
    description:
      'Join group hangouts at nearby venues. Meet 4-8 people at once in a casual setting. VIP tables for premium members.',
    color: 'var(--secondary)',
  },
  {
    icon: Brain,
    title: 'AI Compatibility',
    description:
      'Our AI analyzes conversation style, interests, and values to find people who truly match your energy. Not just looks.',
    color: 'var(--boost)',
  },
  {
    icon: Lightning,
    title: 'Speed Dating',
    description:
      'Three-minute video rounds with fresh faces. If you both spark, you match instantly. Fast, fun, and zero awkwardness.',
    color: 'var(--like)',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-surface-elevated/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-text-muted text-sm font-medium uppercase tracking-wide">
            Not Your Average Dating App
          </p>
          <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
            Features that make{' '}
            <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
              dating fun
            </GradientText>{' '}
            again
          </h2>
          <p className="text-text-secondary mt-4 text-base leading-relaxed">
            We built the features that other dating apps are afraid to try. Real connections need
            more than a swipe.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="mt-16 grid gap-6 sm:mt-20 sm:grid-cols-2 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-surface group relative overflow-hidden rounded-2xl p-8 shadow-sm ring-1 ring-black/[0.03] transition-shadow hover:shadow-md"
            >
              {/* Subtle gradient accent */}
              <div
                className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-[0.06] blur-[60px]"
                style={{ backgroundColor: feature.color }}
              />

              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 12%, transparent)` }}
              >
                <feature.icon size={24} weight="duotone" style={{ color: feature.color }} />
              </div>

              <h3 className="font-heading text-text-primary mt-5 text-lg font-bold">
                {feature.title}
              </h3>

              <p className="text-text-secondary mt-2 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
