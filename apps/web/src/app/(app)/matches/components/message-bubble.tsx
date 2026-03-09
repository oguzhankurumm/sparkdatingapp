'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageBubble as UIMessageBubble } from '@spark/ui'
import { Check, Checks, Translate } from '@phosphor-icons/react'
import type { Message } from '../types'
import { formatMessageTime } from '../utils'

interface ChatMessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  const isGif = message.type === 'gif' && message.metadata?.gif
  const hasTranslation = !!message.translatedContent
  const [showOriginal, setShowOriginal] = useState(false)

  const displayContent =
    hasTranslation && !showOriginal ? message.translatedContent! : message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={isOwn ? 'flex justify-end' : 'flex justify-start'}
    >
      <div className="max-w-[75%]">
        {isGif ? (
          <div className="overflow-hidden rounded-2xl">
            <img
              src={message.metadata!.gif!.giphyUrl}
              alt="GIF"
              className="max-h-[200px] w-auto rounded-2xl object-contain"
              loading="lazy"
            />
            <div className="text-text-muted mt-0.5 text-right text-[10px]">
              {formatMessageTime(message.createdAt)}
            </div>
          </div>
        ) : (
          <>
            <UIMessageBubble
              variant={isOwn ? 'sent' : 'received'}
              message={displayContent}
              timestamp={formatMessageTime(message.createdAt)}
            />
            {hasTranslation && (
              <button
                type="button"
                onClick={() => setShowOriginal((v) => !v)}
                className="text-text-muted hover:text-text-secondary mt-0.5 flex items-center gap-1 text-[10px] transition-colors"
              >
                <Translate size={10} weight="bold" />
                {showOriginal ? 'Show translation' : 'See original'}
              </button>
            )}
          </>
        )}
        {isOwn && (
          <div className="mt-0.5 flex justify-end pr-1">
            {message.readAt ? (
              <Checks size={14} className="text-super-like" weight="bold" />
            ) : (
              <Check size={14} className="text-text-muted" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
