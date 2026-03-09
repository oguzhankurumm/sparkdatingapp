'use client'

import { useCallback, useState } from 'react'
import { ChatInput as UIChatInput } from '@spark/ui'
import { GifPicker } from './gif-picker'
import type { GifMetadata } from '../types'

interface GiphyGif {
  id: string
  url: string
  previewUrl: string
  width: number
  height: number
  title: string
}

interface ChatInputBarProps {
  onSend: (message: string) => void
  onGifSend?: (metadata: GifMetadata) => void
  onTyping?: () => void
  disabled?: boolean
  prefillValue?: string
}

export function ChatInputBar({
  onSend,
  onGifSend,
  onTyping,
  disabled,
  prefillValue,
}: ChatInputBarProps) {
  const [gifPickerOpen, setGifPickerOpen] = useState(false)

  const handleKeyDown = useCallback(() => {
    onTyping?.()
  }, [onTyping])

  const handleGifSelect = useCallback(
    (gif: GiphyGif) => {
      onGifSend?.({
        giphyId: gif.id,
        giphyUrl: gif.url,
        giphyPreview: gif.previewUrl,
        width: gif.width,
        height: gif.height,
      })
    },
    [onGifSend],
  )

  return (
    <div>
      <GifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onSelect={handleGifSelect}
      />
      <UIChatInput
        onSend={onSend}
        onGifClick={() => setGifPickerOpen((prev) => !prev)}
        placeholder="Type a message..."
        disabled={disabled}
        onKeyDown={handleKeyDown}
        prefillValue={prefillValue}
      />
    </div>
  )
}
