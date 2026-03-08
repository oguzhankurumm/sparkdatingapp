import { forwardRef } from 'react'
import { Sun, Moon, CloudSun } from '@phosphor-icons/react'
import { cn } from '../utils/cn'

interface AIGreetingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
}

const greetings = {
  morning: { text: 'Good Morning', icon: Sun },
  afternoon: { text: 'Good Afternoon', icon: CloudSun },
  evening: { text: 'Good Evening', icon: Moon },
} as const

const AIGreetingCard = forwardRef<HTMLDivElement, AIGreetingCardProps>(
  ({ className, name, timeOfDay = 'morning', ...props }, ref) => {
    const greeting = greetings[timeOfDay]
    const Icon = greeting.icon

    return (
      <div
        ref={ref}
        className={cn('rounded-2xl bg-[image:var(--gradient-brand)] p-5 text-white', className)}
        {...props}
      >
        <div className="flex items-center gap-2">
          <Icon size={24} weight="fill" className="text-white/80" />
          <span className="text-sm font-medium text-white/80">{greeting.text}</span>
        </div>
        <h2 className="mt-1 text-2xl font-bold">{name}!</h2>
        <p className="mt-1 text-sm text-white/70">Ready to find your spark today?</p>
      </div>
    )
  },
)
AIGreetingCard.displayName = 'AIGreetingCard'

export { AIGreetingCard }
export type { AIGreetingCardProps }
