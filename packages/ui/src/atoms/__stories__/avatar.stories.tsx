import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from '../avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
    ring: { control: 'select', options: ['none', 'story', 'live'] },
    verified: { control: 'boolean' },
    online: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: { fallback: 'Sarah Johnson', size: 'lg' },
}

export const WithPhoto: Story = {
  args: {
    src: 'https://i.pravatar.cc/300?u=sarah',
    fallback: 'Sarah',
    size: 'lg',
  },
}

export const Verified: Story = {
  args: { fallback: 'Emma', size: 'lg', verified: true },
}

export const Online: Story = {
  args: { fallback: 'Alex', size: 'lg', online: true },
}

export const StoryRing: Story = {
  args: { fallback: 'Mia', size: 'xl', ring: 'story' },
}

export const LiveRing: Story = {
  args: { fallback: 'Live', size: 'xl', ring: 'live' },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar size="xs" fallback="XS" />
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
      <Avatar size="xl" fallback="XL" />
      <Avatar size="2xl" fallback="2XL" />
    </div>
  ),
}
