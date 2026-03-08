import type { Meta, StoryObj } from '@storybook/react'
import { Heart, X, Star, Lightning } from '@phosphor-icons/react'
import { Button } from '../button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'like', 'pass', 'super-like'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon', 'icon-lg', 'icon-xl'],
    },
    rounded: { control: 'select', options: ['default', 'full'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Get Started' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Learn More' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete Account' },
}

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Sending...' },
}

export const LikeButton: Story = {
  args: { variant: 'like', size: 'icon-xl', children: <Heart size={28} weight="fill" /> },
}

export const PassButton: Story = {
  args: { variant: 'pass', size: 'icon-xl', children: <X size={28} weight="bold" /> },
}

export const SuperLikeButton: Story = {
  args: { variant: 'super-like', size: 'icon-xl', children: <Star size={28} weight="fill" /> },
}

export const SwipeActions: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="pass" size="icon-lg">
        <X size={24} weight="bold" />
      </Button>
      <Button variant="super-like" size="icon-lg">
        <Star size={24} weight="fill" />
      </Button>
      <Button variant="like" size="icon-xl">
        <Heart size={28} weight="fill" />
      </Button>
      <Button variant="primary" size="icon-lg" rounded="full">
        <Lightning size={24} weight="fill" />
      </Button>
    </div>
  ),
}
