'use client'

import { motion } from 'framer-motion'
import { Star } from '@phosphor-icons/react'
import { GradientText } from '@spark/ui'

const reviews = [
  {
    name: 'Jessica M.',
    age: 27,
    location: 'New York',
    rating: 5,
    text: "The video call feature changed everything. I could tell within 2 minutes if we vibed. Ended up dating the third person I called — we've been together 6 months now.",
    gradient: 'from-rose-200 to-pink-300',
  },
  {
    name: 'Daniel K.',
    age: 31,
    location: 'London',
    rating: 5,
    text: 'Tables are genius. Showed up to a dinner with 5 strangers and left with 2 matches and 3 new friends. Way better than swiping alone on my couch.',
    gradient: 'from-blue-200 to-indigo-300',
  },
  {
    name: 'Priya R.',
    age: 25,
    location: 'Toronto',
    rating: 5,
    text: 'As a woman, I love that Spark gives us premium features for free. The AI icebreakers actually work — no more "hey" messages. Quality conversations from day one.',
    gradient: 'from-amber-200 to-orange-300',
  },
]

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
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
            Real Stories
          </p>
          <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
            People love{' '}
            <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
              Spark
            </GradientText>
          </h2>
        </motion.div>

        {/* Reviews grid */}
        <div className="mt-16 grid gap-6 sm:mt-20 md:grid-cols-3 md:gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-surface flex flex-col rounded-2xl p-6 shadow-sm ring-1 ring-black/[0.03]"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} size={16} weight="fill" className="text-[var(--boost)]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-text-secondary mt-4 flex-1 text-sm leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${review.gradient}`} />
                <div>
                  <p className="text-text-primary text-sm font-semibold">
                    {review.name}, {review.age}
                  </p>
                  <p className="text-text-muted text-xs">{review.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
