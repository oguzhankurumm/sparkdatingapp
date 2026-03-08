import { forwardRef } from 'react'
import { Wallet, Plus } from '@phosphor-icons/react'
import { cn } from '../utils/cn'
import { Button } from '../atoms/button'

interface TokenBalanceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  totalBalance: number
  purchased: number
  earned: number
  formatTokens: (tokens: number) => string
  onTopUp?: () => void
}

const TokenBalanceCard = forwardRef<HTMLDivElement, TokenBalanceCardProps>(
  ({ className, totalBalance, purchased, earned, formatTokens, onTopUp, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-2xl bg-[image:var(--gradient-brand)] p-5 text-white',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={20} weight="fill" className="text-white/80" />
            <span className="text-sm font-medium text-white/80">Token Balance</span>
          </div>
          {onTopUp ? (
            <Button
              variant="secondary"
              size="sm"
              rounded="full"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={onTopUp}
            >
              <Plus size={14} weight="bold" />
              Top Up
            </Button>
          ) : null}
        </div>

        <p className="mt-3 text-3xl font-extrabold">{formatTokens(totalBalance)}</p>

        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs text-white/60">Purchased</p>
            <p className="text-sm font-semibold">{formatTokens(purchased)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Earned</p>
            <p className="text-sm font-semibold">{formatTokens(earned)}</p>
          </div>
        </div>
      </div>
    )
  },
)
TokenBalanceCard.displayName = 'TokenBalanceCard'

export { TokenBalanceCard }
export type { TokenBalanceCardProps }
