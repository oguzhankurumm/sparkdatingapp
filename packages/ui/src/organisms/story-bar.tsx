import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { StoryCircle } from '../molecules/story-circle'

interface StoryItem {
  id: string
  username: string
  avatar?: string
  seen: boolean
}

interface StoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  stories: StoryItem[]
  onStoryClick?: (id: string) => void
  onAddStory?: () => void
}

const StoryBar = forwardRef<HTMLDivElement, StoryBarProps>(
  ({ className, stories, onStoryClick, onAddStory, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('scrollbar-none flex gap-3 overflow-x-auto px-4 py-3', className)}
        {...props}
      >
        <StoryCircle username="You" isAdd onClick={onAddStory} />
        {stories.map((story) => (
          <StoryCircle
            key={story.id}
            username={story.username}
            src={story.avatar}
            seen={story.seen}
            onClick={() => onStoryClick?.(story.id)}
          />
        ))}
      </div>
    )
  },
)
StoryBar.displayName = 'StoryBar'

export { StoryBar }
export type { StoryBarProps, StoryItem }
