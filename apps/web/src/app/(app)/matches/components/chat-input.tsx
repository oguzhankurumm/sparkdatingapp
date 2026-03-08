'use client'

import { useCallback } from 'react'
import { ChatInput as UIChatInput } from '@spark/ui'

interface ChatInputBarProps {
  onSend: (message: string) => void
  onTyping?: () => void
  disabled?: boolean
}

export function ChatInputBar({ onSend, onTyping, disabled }: ChatInputBarProps) {
  const handleKeyDown = useCallback(() => {
    onTyping?.()
  }, [onTyping])

  return (
    <UIChatInput
      onSend={onSend}
      placeholder="Type a message..."
      disabled={disabled}
      onKeyDown={handleKeyDown}
    />
  )
}
