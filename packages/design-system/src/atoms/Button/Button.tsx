import clsx from 'clsx'
import type { ButtonProps } from './Button.types'
import { Spinner } from '../Spinner'

const variantClasses: Record<string, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-400 focus-visible:ring-primary-400',
  secondary: 'bg-brand-700 text-neutral-100 border border-brand-600 hover:bg-brand-600 focus-visible:ring-brand-500',
  ghost: 'bg-transparent text-neutral-300 hover:bg-brand-800 hover:text-neutral-100 focus-visible:ring-brand-600',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-colors duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
      {children}
    </button>
  )
}
