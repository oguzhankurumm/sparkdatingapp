import { forwardRef } from 'react'
import { cn } from '../utils/cn'

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  htmlFor?: string
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, error, helperText, required, htmlFor, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        {label ? (
          <label htmlFor={htmlFor} className="text-text-primary text-sm font-medium">
            {label}
            {required ? <span className="text-danger ml-0.5">*</span> : null}
          </label>
        ) : null}
        {children}
        {error ? (
          <p className="text-danger text-xs">{error}</p>
        ) : helperText ? (
          <p className="text-text-muted text-xs">{helperText}</p>
        ) : null}
      </div>
    )
  },
)
FormField.displayName = 'FormField'

export { FormField }
export type { FormFieldProps }
