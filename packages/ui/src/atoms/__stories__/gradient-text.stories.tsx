import type { Meta, StoryObj } from '@storybook/react'
import { GradientText } from '../gradient-text'

const meta: Meta<typeof GradientText> = {
  title: 'Atoms/GradientText',
  component: GradientText,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof GradientText>

export const Brand: Story = {
  args: {
    gradient: 'brand',
    as: 'h1',
    className: 'text-3xl font-extrabold',
    children: "It's a Match!",
  },
}

export const CTA: Story = {
  args: {
    gradient: 'cta',
    as: 'h2',
    className: 'text-2xl font-bold',
    children: 'Upgrade to Premium',
  },
}

export const Like: Story = {
  args: { gradient: 'like', as: 'span', className: 'text-xl font-bold', children: 'LIKE' },
}

export const Premium: Story = {
  args: { gradient: 'premium', as: 'span', className: 'text-lg font-bold', children: 'Premium' },
}

export const Platinum: Story = {
  args: { gradient: 'platinum', as: 'span', className: 'text-lg font-bold', children: 'Platinum' },
}
