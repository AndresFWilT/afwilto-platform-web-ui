import clsx from 'clsx'
import type { SelectProps } from './Select.types'

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-4 py-3 text-lg rounded-lg',
}

export function Select({
  selectSize = 'md',
  error = false,
  className,
  disabled,
  children,
  ...props
}: SelectProps) {
  return (
    <div className="relative flex items-center w-full">
      <select
        disabled={disabled}
        className={clsx(
          'w-full appearance-none border bg-brand-800 text-neutral-100 pr-9',
          'transition-colors duration-150 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500 focus:ring-red-400'
            : 'border-surface-border focus:border-primary-400 focus:ring-primary-400',
          'disabled:bg-brand-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
          sizeClasses[selectSize],
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span aria-hidden className="absolute right-3 text-neutral-400 pointer-events-none text-xs">
        ▾
      </span>
    </div>
  )
}
