import { forwardRef } from 'react'
import { Crown, Star } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

type SubscriptionPlan = 'free' | 'premium' | 'platinum'

interface PlanBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  plan: SubscriptionPlan
}

const planStyles: Record<SubscriptionPlan, { bg: string; icon: React.ReactNode; label: string }> = {
  free: {
    bg: 'bg-pass/10 text-pass',
    icon: null,
    label: 'Free',
  },
  premium: {
    bg: 'bg-[image:var(--gradient-premium)] text-white',
    icon: <Star size={12} weight="fill" />,
    label: 'Premium',
  },
  platinum: {
    bg: 'bg-[image:var(--gradient-platinum)] text-white',
    icon: <Crown size={12} weight="fill" />,
    label: 'Platinum',
  },
}

const PlanBadge = forwardRef<HTMLSpanElement, PlanBadgeProps>(
  ({ className, plan, ...props }, ref) => {
    const planStyle = planStyles[plan]

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          planStyle.bg,
          className,
        )}
        {...props}
      >
        {planStyle.icon}
        {planStyle.label}
      </span>
    )
  },
)
PlanBadge.displayName = 'PlanBadge'

export { PlanBadge }
export type { PlanBadgeProps }
