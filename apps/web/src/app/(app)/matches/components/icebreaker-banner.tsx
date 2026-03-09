'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ArrowsClockwise } from '@phosphor-icons/react'
import { useIcebreaker } from '../hooks/use-icebreaker'

interface IcebreakerBannerProps {
  matchId: string
  /** Fills the chat input with the selected suggestion */
  onSelect: (text: string) => void
}

export function IcebreakerBanner({ matchId, onSelect }: IcebreakerBannerProps) {
  const icebreaker = useIcebreaker()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [refreshesRemaining, setRefreshesRemaining] = useState(3)
  const [dismissed, setDismissed] = useState(false)

  // Auto-fetch on first render
  useEffect(() => {
    if (suggestions.length === 0 && !icebreaker.isPending) {
      icebreaker.mutate(matchId, {
        onSuccess: (data) => {
          setSuggestions(data.suggestions)
          setRefreshesRemaining(data.refreshesRemaining)
        },
      })
    }
  }, [matchId])

  const handleRefresh = useCallback(() => {
    if (refreshesRemaining <= 0) return
    icebreaker.mutate(matchId, {
      onSuccess: (data) => {
        setSuggestions(data.suggestions)
        setRefreshesRemaining(data.refreshesRemaining)
      },
    })
  }, [matchId, refreshesRemaining, icebreaker])

  const handleSelect = useCallback(
    (text: string) => {
      onSelect(text)
      setDismissed(true)
    },
    [onSelect],
  )

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="border-border-subtle bg-surface-elevated mx-4 mb-3 rounded-2xl border p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-full">
            <Lightbulb className="text-primary h-4 w-4" weight="fill" />
          </div>
          <span className="text-text-primary text-sm font-medium">How to start?</span>
        </div>
        {refreshesRemaining > 0 && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={icebreaker.isPending}
            className="text-text-muted hover:text-text-secondary flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
          >
            <ArrowsClockwise
              className={`h-3.5 w-3.5 ${icebreaker.isPending ? 'animate-spin' : ''}`}
            />
            New ({refreshesRemaining})
          </button>
        )}
      </div>

      {/* Suggestion chips */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {icebreaker.isPending && suggestions.length === 0 ? (
            // Shimmer loading state
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface h-10 animate-pulse rounded-xl"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="suggestions" className="space-y-2">
              {suggestions.map((text, i) => (
                <motion.button
                  key={`${text}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  type="button"
                  onClick={() => handleSelect(text)}
                  className="bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary border-border-subtle w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-all hover:shadow-sm active:scale-[0.98]"
                >
                  {text}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-text-secondary mt-3 w-full text-center text-xs transition-colors"
      >
        Dismiss
      </button>
    </motion.div>
  )
}
