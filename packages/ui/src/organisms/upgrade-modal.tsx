'use client'

import { forwardRef } from 'react'
import { X, Star, Crown } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Button } from '../atoms/button'
import { GradientText } from '../atoms/gradient-text'

interface UpgradeModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  onUpgrade: (plan: 'premium' | 'platinum') => void
  feature: string
  requiredPlan?: 'premium' | 'platinum'
}

const UpgradeModal = forwardRef<HTMLDivElement, UpgradeModalProps>(
  ({ className, open, onClose, onUpgrade, feature, requiredPlan = 'premium', ...props }, ref) => {
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn('z-modal fixed inset-0 flex items-center justify-center p-4', className)}
        {...props}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          role="button"
          tabIndex={-1}
          aria-label="Close"
        />

        <div className="bg-surface-elevated relative z-10 w-full max-w-sm rounded-3xl p-8 text-center shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:bg-surface absolute right-4 top-4 rounded-full p-1"
          >
            <X size={20} />
          </button>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-premium)]">
            {requiredPlan === 'platinum' ? (
              <Crown size={32} weight="fill" className="text-white" />
            ) : (
              <Star size={32} weight="fill" className="text-white" />
            )}
          </div>

          <h3 className="text-text-primary mt-4 text-xl font-bold">
            Unlock{' '}
            <GradientText gradient={requiredPlan === 'platinum' ? 'platinum' : 'premium'}>
              {feature}
            </GradientText>
          </h3>

          <p className="text-text-secondary mt-2 text-sm">
            This feature is available on{' '}
            <span className="font-semibold capitalize">{requiredPlan}</span> plan
          </p>

          <div className="mt-6 space-y-3">
            <Button
              variant="primary"
              size="lg"
              rounded="full"
              className="w-full"
              onClick={() => onUpgrade(requiredPlan)}
            >
              Upgrade to {requiredPlan === 'platinum' ? 'Platinum' : 'Premium'}
            </Button>
            <Button variant="ghost" size="md" className="w-full" onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </div>
    )
  },
)
UpgradeModal.displayName = 'UpgradeModal'

export { UpgradeModal }
export type { UpgradeModalProps }
