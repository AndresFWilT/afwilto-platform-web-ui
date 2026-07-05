import clsx from 'clsx'
import type { TextareaProps } from './Textarea.types'

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-4 py-3 text-lg rounded-lg',
}

export function Textarea({
  textareaSize = 'md',
  error = false,
  className,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <textarea
      disabled={disabled}
      rows={rows}
      className={clsx(
        'w-full border bg-brand-800 text-neutral-100 placeholder-neutral-500 resize-y',
        'transition-colors duration-150 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-500 focus:ring-red-400'
          : 'border-surface-border focus:border-primary-400 focus:ring-primary-400',
        'disabled:bg-brand-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
        sizeClasses[textareaSize],
        className
      )}
      {...props}
    />
  )
}
