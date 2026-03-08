import type { Meta, StoryObj } from '@storybook/react'
import { AuthLayout } from '../auth-layout'
import { Button } from '../../atoms/button'
import { Input } from '../../atoms/input'

const meta: Meta<typeof AuthLayout> = {
  title: 'Templates/AuthLayout',
  component: AuthLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof AuthLayout>

export const LoginScreen: Story = {
  args: {
    title: 'Welcome Back',
    subtitle: 'Sign in to continue finding your spark',
    children: (
      <div className="space-y-4">
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />
        <Button variant="primary" className="w-full" rounded="full">
          Sign In
        </Button>
        <p className="text-text-muted text-center text-sm">
          Don&apos;t have an account?{' '}
          <button type="button" className="text-primary font-semibold">
            Sign Up
          </button>
        </p>
      </div>
    ),
  },
}
