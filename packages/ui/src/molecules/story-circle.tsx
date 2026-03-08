import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface StoryCircleProps extends React.HTMLAttributes<HTMLButtonElement> {
  src?: string
  username: string
  seen?: boolean
  isAdd?: boolean
}

const StoryCircle = forwardRef<HTMLButtonElement, StoryCircleProps>(
  ({ className, src, username, seen = false, isAdd = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn('flex w-16 flex-col items-center gap-1', className)}
        {...props}
      >
        <div className="relative">
          {/* Ring */}
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full p-[2.5px]',
              seen ? 'bg-border' : isAdd ? 'bg-primary' : 'bg-[image:var(--gradient-brand)]',
            )}
          >
            <div className="bg-background flex h-full w-full items-center justify-center overflow-hidden rounded-full">
              {isAdd ? (
                <span className="text-primary text-xl">+</span>
              ) : src ? (
                <img src={src} alt={username} className="h-full w-full object-cover" />
              ) : (
                <span className="text-text-muted text-sm font-semibold">
                  {username[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-text-secondary w-full truncate text-center text-[10px]">
          {isAdd ? 'Add Story' : username}
        </span>
      </button>
    )
  },
)
StoryCircle.displayName = 'StoryCircle'

export { StoryCircle }
export type { StoryCircleProps }
