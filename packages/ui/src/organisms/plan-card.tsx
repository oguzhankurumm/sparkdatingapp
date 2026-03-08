'use client'

import { forwardRef } from 'react'
import { Check, Star, Crown } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Button } from '../atoms/button'

interface PlanFeature {
  label: string
  included: boolean
}

interface PlanCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  plan: 'free' | 'premium' | 'platinum'
  price: { monthly: number; yearly: number }
  billingPeriod: 'monthly' | 'yearly'
  features: PlanFeature[]
  popular?: boolean
  current?: boolean
  onSelect?: () => void
}

const planGradients = {
  free: '',
  premium: 'bg-[image:var(--gradient-premium)]',
  platinum: 'bg-[image:var(--gradient-platinum)]',
} as const

const PlanCard = forwardRef<HTMLDivElement, PlanCardProps>(
  (
    { className, name, plan, price, billingPeriod, features, popular, current, onSelect, ...props },
    ref,
  ) => {
    const currentPrice = billingPeriod === 'monthly' ? price.monthly : price.yearly
    const Icon = plan === 'platinum' ? Crown : Star

    return (
      <div
        ref={ref}
        className={cn(
          'bg-surface-elevated relative rounded-2xl border p-6',
          popular ? 'border-primary shadow-glow' : 'border-border',
          className,
        )}
        {...props}
      >
        {popular ? (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[image:var(--gradient-cta)] px-3 py-0.5 text-xs font-semibold text-white">
            Most Popular
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          {plan !== 'free' ? (
            <div className={cn('rounded-lg p-1.5 text-white', planGradients[plan])}>
              <Icon size={18} weight="fill" />
            </div>
          ) : null}
          <h3 className="text-text-primary text-lg font-bold">{name}</h3>
        </div>

        <div className="mt-3">
          {plan === 'free' ? (
            <p className="text-text-primary text-3xl font-extrabold">Free</p>
          ) : (
            <div className="flex items-baseline gap-1">
              <p className="text-text-primary text-3xl font-extrabold">
                ${currentPrice.toFixed(2)}
              </p>
              <span className="text-text-muted text-sm">/mo</span>
            </div>
          )}
          {billingPeriod === 'yearly' && plan !== 'free' ? (
            <p className="text-success mt-0.5 text-xs">
              Save {Math.round(((price.monthly - price.yearly) / price.monthly) * 100)}%
            </p>
          ) : null}
        </div>

        <ul className="mt-5 space-y-2.5">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2 text-sm">
              <Check
                size={16}
                weight="bold"
                className={cn(
                  'mt-0.5 shrink-0',
                  feature.included ? 'text-success' : 'text-text-muted/30',
                )}
              />
              <span
                className={cn(
                  feature.included ? 'text-text-primary' : 'text-text-muted line-through',
                )}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {current ? (
            <Button variant="secondary" size="lg" rounded="full" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button
              variant={popular ? 'primary' : 'secondary'}
              size="lg"
              rounded="full"
              className="w-full"
              onClick={onSelect}
            >
              {plan === 'free' ? 'Get Started' : `Upgrade to ${name}`}
            </Button>
          )}
        </div>
      </div>
    )
  },
)
PlanCard.displayName = 'PlanCard'

export { PlanCard }
export type { PlanCardProps, PlanFeature }
