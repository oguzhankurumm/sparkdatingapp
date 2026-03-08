'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  isVisible: boolean
  name?: string
}

export function TypingIndicator({ isVisible, name }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2 px-1 py-2"
        >
          <div className="border-border-subtle bg-surface-elevated flex items-center gap-1 rounded-2xl rounded-bl-md border px-4 py-2.5">
            <motion.span
              className="bg-text-muted inline-block h-2 w-2 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.span
              className="bg-text-muted inline-block h-2 w-2 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.15,
              }}
            />
            <motion.span
              className="bg-text-muted inline-block h-2 w-2 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.3,
              }}
            />
          </div>
          {name && <span className="text-text-muted text-xs">{name} is typing</span>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
