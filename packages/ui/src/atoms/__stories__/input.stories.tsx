import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../input'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'search', 'otp'] },
    error: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: 'Enter your name...' },
}

export const Search: Story = {
  args: { variant: 'search', placeholder: 'Search matches...' },
}

export const Password: Story = {
  args: { type: 'password', placeholder: 'Password' },
}

export const WithError: Story = {
  args: { placeholder: 'Email', error: true, defaultValue: 'invalid-email' },
}

export const OTP: Story = {
  args: { variant: 'otp', maxLength: 1, placeholder: '0' },
}

export const Disabled: Story = {
  args: { placeholder: 'Disabled input', disabled: true },
}
