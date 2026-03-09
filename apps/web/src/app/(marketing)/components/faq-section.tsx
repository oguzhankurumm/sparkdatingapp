'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretDown } from '@phosphor-icons/react'
import { GradientText } from '@spark/ui'

const faqs = [
  {
    q: 'Is Spark really free?',
    a: 'Yes! You can create a profile, swipe, match, chat, and video call for free. Premium and Platinum plans unlock extra features like AI Dating Helper, incognito mode, and unlimited boosts.',
  },
  {
    q: 'How is Spark different from other dating apps?',
    a: 'Spark focuses on real connections through video calls, live group tables, AI compatibility scoring, and speed dating. We go beyond the swipe to help you actually meet people.',
  },
  {
    q: 'Do women really get premium features for free?',
    a: 'Absolutely. Women get unlimited likes, see who liked them, rewinds, advanced filters, read receipts, and a weekly boost — all for free. We believe great dating starts with empowering women.',
  },
  {
    q: 'What are Tables?',
    a: 'Tables are group hangouts at real venues. A host creates a table for 4-8 people, picks a time and place, and others can join. Think dinner party meets dating — way less pressure than a one-on-one first date.',
  },
  {
    q: 'How does video calling work?',
    a: "Once you match, either person can start a video call with one tap. No phone numbers exchanged. Calls are billed per minute in tokens — you'll see the rate before connecting. End-to-end encrypted.",
  },
  {
    q: 'Is my data safe?',
    a: 'Your privacy is our priority. All conversations are encrypted, photos go through AI moderation, and we never sell your data. Verified profiles use selfie-matching technology to keep catfishing out.',
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-text-muted text-sm font-medium uppercase tracking-wide">FAQ</p>
          <h2 className="font-heading text-text-primary mt-3 text-3xl font-bold sm:text-4xl">
            Got{' '}
            <GradientText gradient="brand" as="span" className="text-3xl sm:text-4xl">
              questions
            </GradientText>
            ?
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="mt-12 divide-y divide-[var(--border)]">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="text-text-primary text-sm font-semibold sm:text-base">
                    {faq.q}
                  </span>
                  <CaretDown
                    size={18}
                    weight="bold"
                    className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-text-secondary pb-5 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
