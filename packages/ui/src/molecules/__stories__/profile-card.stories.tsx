import type { Meta, StoryObj } from '@storybook/react'
import { ProfileCard } from '../profile-card'

const meta: Meta<typeof ProfileCard> = {
  title: 'Molecules/ProfileCard',
  component: ProfileCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ProfileCard>

export const Default: Story = {
  args: {
    name: 'Sarah',
    age: 26,
    photo: 'https://i.pravatar.cc/600?u=sarah',
  },
}

export const WithDetails: Story = {
  args: {
    name: 'Emma',
    age: 24,
    photo: 'https://i.pravatar.cc/600?u=emma',
    distance: '3 km',
    zodiac: 'Leo',
    matchPercent: 87,
    verified: true,
  },
}

export const Liked: Story = {
  args: {
    name: 'Mia',
    age: 28,
    photo: 'https://i.pravatar.cc/600?u=mia',
    stamp: 'like',
    stampOpacity: 0.8,
  },
}

export const Noped: Story = {
  args: {
    name: 'Alex',
    age: 25,
    photo: 'https://i.pravatar.cc/600?u=alex',
    stamp: 'nope',
    stampOpacity: 0.8,
  },
}
