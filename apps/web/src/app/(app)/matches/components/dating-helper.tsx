'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkle, X, CircleNotch } from '@phosphor-icons/react'
import { Button } from '@spark/ui'
import { useCurrentUser } from '@/lib/hooks/use-auth'
import { useDatingHelper } from '../hooks'
import type { Message } from '../types'

const TONES = [
  { value: 'casual' as const, label: 'Casual' },
  { value: 'flirty' as const, label: 'Flirty' },
  { value: 'funny' as const, label: 'Funny' },
  { value: 'deep' as const, label: 'Deep' },
]

interface DatingHelperProps {
  matchId: string
  messages: Message[]
  currentUserId?: string
  onSelectSuggestion: (text: string) => void
}

export function DatingHelper({
  matchId,
  messages,
  currentUserId,
  onSelectSuggestion,
}: DatingHelperProps) {
  const { data: user } = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTone, setSelectedTone] = useState<'casual' | 'flirty' | 'deep' | 'funny'>('casual')
  const datingHelper = useDatingHelper(matchId)

  const isPlatinum = user?.plan === 'platinum'

  // Build recent messages context (last 10 messages)
  const recentMessages = useMemo(() => {
    const recent = messages.slice(-10)
    return recent
      .filter((m) => m.type === 'text' && m.content)
      .map((m) => ({
        role: (m.senderId === currentUserId ? 'user' : 'partner') as 'user' | 'partner',
        content: m.content,
      }))
  }, [messages, currentUserId])

  const handleGenerate = () => {
    datingHelper.mutate({
      recentMessages,
      tone: selectedTone,
    })
  }

  const handleSelect = (suggestion: string) => {
    onSelectSuggestion(suggestion)
    setIsOpen(false)
    datingHelper.reset()
  }

  if (!isPlatinum) return null

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            type="button"
            onClick={() => setIsOpen(true)}
            className="from-primary to-secondary absolute bottom-full right-3 mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r shadow-lg"
            aria-label="AI Dating Helper"
          >
            <Sparkle size={20} weight="fill" className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Suggestions panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="border-border-subtle bg-surface-elevated absolute bottom-full left-0 right-0 mb-1 rounded-2xl border p-3 shadow-lg"
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkle size={16} weight="fill" className="text-primary" />
                <span className="text-text-primary text-xs font-semibold">AI Dating Helper</span>
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase">
                  Platinum
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  datingHelper.reset()
                }}
                className="text-text-muted hover:text-text-secondary p-0.5"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>

            {/* Tone selector */}
            <div className="mb-2.5 flex gap-1.5">
              {TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  onClick={() => setSelectedTone(tone.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedTone === tone.value
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>

            {/* Generate / suggestions */}
            {!datingHelper.data && !datingHelper.isPending && (
              <Button variant="primary" size="sm" onClick={handleGenerate} className="w-full">
                <Sparkle size={14} weight="fill" className="mr-1" />
                Generate suggestions
              </Button>
            )}

            {datingHelper.isPending && (
              <div className="flex items-center justify-center gap-2 py-3">
                <CircleNotch size={16} className="text-primary animate-spin" />
                <span className="text-text-muted text-xs">Crafting suggestions...</span>
              </div>
            )}

            {datingHelper.data && (
              <div className="space-y-1.5">
                {datingHelper.data.suggestions.map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className="bg-surface hover:bg-primary/5 hover:border-primary/30 border-border-subtle text-text-primary w-full rounded-xl border p-2.5 text-left text-[13px] leading-snug transition-colors"
                  >
                    {suggestion}
                  </motion.button>
                ))}
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-primary hover:text-primary/80 mt-1 w-full text-center text-[11px] font-medium"
                >
                  Regenerate
                </button>
              </div>
            )}

            {datingHelper.isError && (
              <div className="py-2 text-center">
                <p className="text-danger text-xs">Failed to generate suggestions</p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-primary mt-1 text-[11px] font-medium"
                >
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
