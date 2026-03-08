import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../badge'

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: { children: '3 new' },
}

export const Verified: Story = {
  args: { variant: 'verified', children: 'Verified' },
}

export const Match: Story = {
  args: { variant: 'match', children: '92% Match' },
}

export const Online: Story = {
  args: { variant: 'online', children: 'Online' },
}

export const Boost: Story = {
  args: { variant: 'boost', children: 'Boosted' },
}

export const PlanFree: Story = {
  args: { variant: 'plan', plan: 'free', children: 'Free' },
}

export const PlanPremium: Story = {
  args: { variant: 'plan', plan: 'premium', children: 'Premium' },
}

export const PlanPlatinum: Story = {
  args: { variant: 'plan', plan: 'platinum', children: 'Platinum' },
}
