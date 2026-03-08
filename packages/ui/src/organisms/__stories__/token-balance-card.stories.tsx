import type { Meta, StoryObj } from '@storybook/react'
import { TokenBalanceCard } from '../token-balance-card'

const meta: Meta<typeof TokenBalanceCard> = {
  title: 'Organisms/TokenBalanceCard',
  component: TokenBalanceCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof TokenBalanceCard>

const formatTokens = (n: number) => n.toLocaleString()

export const Default: Story = {
  args: {
    totalBalance: 2450,
    purchased: 1000,
    earned: 1450,
    formatTokens,
    onTopUp: () => {},
  },
}

export const NewUser: Story = {
  args: {
    totalBalance: 1000,
    purchased: 0,
    earned: 1000,
    formatTokens,
    onTopUp: () => {},
  },
}
