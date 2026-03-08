/**
 * Format a timestamp to a relative time string.
 * Examples: "Just now", "2m ago", "1h ago", "Yesterday", "Mar 7"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a timestamp to a short time (e.g. "2:30 PM").
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Get a date separator label for message grouping.
 * Returns "Today", "Yesterday", or a formatted date.
 */
export function getDateLabel(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check if a user is "online" based on their last active timestamp.
 * Online = active within the last 30 minutes.
 */
export function isUserOnline(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false
  const lastActive = new Date(lastActiveAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60)
  return diffMinutes < 30
}

/**
 * Group messages by date for rendering date separators.
 * Returns an array of { date, messages } groups.
 */
export function groupMessagesByDate<T extends { createdAt: string }>(
  messages: T[],
): Array<{ date: string; label: string; messages: T[] }> {
  const groups: Array<{ date: string; label: string; messages: T[] }> = []

  for (const message of messages) {
    const dateKey = new Date(message.createdAt).toDateString()
    const lastGroup = groups[groups.length - 1]

    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(message)
    } else {
      groups.push({
        date: dateKey,
        label: getDateLabel(message.createdAt),
        messages: [message],
      })
    }
  }

  return groups
}
