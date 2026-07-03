import clsx from 'clsx'
import type { SpinnerProps } from './Spinner.types'

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-4',
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        'rounded-full border-brand-700 border-t-primary-400 animate-spin',
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}
