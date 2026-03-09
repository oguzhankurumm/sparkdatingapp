'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, Warning } from '@phosphor-icons/react'
import { Button } from '@spark/ui'
import { useResolvePanic } from '../hooks/use-safety'

interface SafetyCheckModalProps {
  open: boolean
  onClose: () => void
  autoResetAt?: string | null
}

export function SafetyCheckModal({ open, onClose, autoResetAt }: SafetyCheckModalProps) {
  const resolvePanic = useResolvePanic()
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirmSafe = useCallback(async () => {
    await resolvePanic.mutateAsync()
    setConfirmed(true)
    // Auto-close after success feedback
    setTimeout(() => {
      setConfirmed(false)
      onClose()
    }, 1500)
  }, [resolvePanic, onClose])

  const autoResetLabel = autoResetAt
    ? new Date(autoResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="border-border bg-surface-elevated relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-lg"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="text-text-muted hover:bg-surface hover:text-text-primary absolute right-4 top-4 rounded-lg p-1 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {confirmed ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="bg-success/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                >
                  <ShieldCheck className="text-success h-8 w-8" weight="fill" />
                </motion.div>
                <h2 className="text-text-primary text-lg font-semibold">Glad you&apos;re safe!</h2>
                <p className="text-text-muted mt-1 text-sm">Your profile is visible again.</p>
              </div>
            ) : (
              /* ── Confirmation state ── */
              <>
                <div className="bg-danger/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                  <Warning className="text-danger h-6 w-6" weight="fill" />
                </div>

                <h2 className="text-text-primary mb-2 text-lg font-semibold">Are you safe?</h2>

                <p className="text-text-secondary mb-2 text-sm leading-relaxed">
                  Panic mode is currently <strong>active</strong>. Your profile is hidden from
                  discovery and your emergency contacts have been notified.
                </p>

                {autoResetLabel && (
                  <p className="text-text-muted mb-4 text-xs">
                    Auto-resets at {autoResetLabel} if not resolved.
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleConfirmSafe}
                    loading={resolvePanic.isPending}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    I&apos;m Safe
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    className="text-text-muted w-full"
                    onClick={onClose}
                  >
                    Keep Panic Mode Active
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
