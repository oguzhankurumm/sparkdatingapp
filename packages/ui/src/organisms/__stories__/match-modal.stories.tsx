import type { Meta, StoryObj } from '@storybook/react'
import { MatchModal } from '../match-modal'

const meta: Meta<typeof MatchModal> = {
  title: 'Organisms/MatchModal',
  component: MatchModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof MatchModal>

export const Default: Story = {
  args: {
    open: true,
    user1: { name: 'You', avatar: 'https://i.pravatar.cc/300?u=you' },
    user2: { name: 'Sarah', avatar: 'https://i.pravatar.cc/300?u=sarah' },
    matchPercent: 92,
    onClose: () => {},
    onSendMessage: () => {},
    onKeepSwiping: () => {},
  },
}

export const WithoutPercent: Story = {
  args: {
    open: true,
    user1: { name: 'You' },
    user2: { name: 'Emma' },
    onClose: () => {},
    onSendMessage: () => {},
    onKeepSwiping: () => {},
  },
}
