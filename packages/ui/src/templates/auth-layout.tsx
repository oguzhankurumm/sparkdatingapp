import { forwardRef } from 'react'
import { cn } from '../utils/cn'
import { GradientText } from '../atoms/gradient-text'

interface AuthLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

const AuthLayout = forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ className, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-background flex min-h-screen items-center justify-center px-4 py-12',
          className,
        )}
        {...props}
      >
        {/* Decorative gradient blob */}
        <div className="pointer-events-none fixed -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[image:var(--gradient-brand)] opacity-10 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Header */}
          {title ? (
            <div className="mb-8 text-center">
              <GradientText as="h1" gradient="brand" className="text-3xl font-extrabold">
                {title}
              </GradientText>
              {subtitle ? <p className="text-text-secondary mt-2 text-sm">{subtitle}</p> : null}
            </div>
          ) : null}

          {/* Card */}
          <div className="border-border-subtle bg-surface-elevated rounded-2xl border p-6 shadow-md sm:p-8">
            {children}
          </div>
        </div>
      </div>
    )
  },
)
AuthLayout.displayName = 'AuthLayout'

export { AuthLayout }
export type { AuthLayoutProps }
