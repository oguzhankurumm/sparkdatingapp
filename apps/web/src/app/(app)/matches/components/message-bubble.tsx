'use client'

import { motion } from 'framer-motion'
import { MessageBubble as UIMessageBubble } from '@spark/ui'
import { Check, Checks } from '@phosphor-icons/react'
import type { Message } from '../types'
import { formatMessageTime } from '../utils'

interface ChatMessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={isOwn ? 'flex justify-end' : 'flex justify-start'}
    >
      <div className="max-w-[75%]">
        <UIMessageBubble
          variant={isOwn ? 'sent' : 'received'}
          message={message.content}
          timestamp={formatMessageTime(message.createdAt)}
        />
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
