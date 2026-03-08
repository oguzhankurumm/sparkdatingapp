import type { Meta, StoryObj } from '@storybook/react'
import { MessageBubble } from '../message-bubble'

const meta: Meta<typeof MessageBubble> = {
  title: 'Molecules/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MessageBubble>

export const Sent: Story = {
  args: {
    variant: 'sent',
    children: 'Hey! I loved your hiking photos 🏔️',
    timestamp: '2:34 PM',
  },
}

export const Received: Story = {
  args: {
    variant: 'received',
    children: 'Thanks! That was in Cappadocia, have you been?',
    timestamp: '2:35 PM',
  },
}

export const Gift: Story = {
  args: {
    variant: 'gift',
    children: '🌹 Sent you a Rose (50 tokens)',
    timestamp: '2:36 PM',
  },
}

export const Translated: Story = {
  args: {
    variant: 'received',
    children: 'Merhaba, nasılsın?',
    timestamp: '2:37 PM',
    translated: true,
  },
}
