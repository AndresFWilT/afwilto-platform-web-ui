import clsx from 'clsx'
import type { BadgeProps } from './Badge.types'

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
  success: 'bg-green-500/20 text-green-300 border border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  error: 'bg-red-500/20 text-red-300 border border-red-500/30',
  neutral: 'bg-brand-700/60 text-neutral-300 border border-surface-border',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ variant = 'neutral', size = 'md', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
