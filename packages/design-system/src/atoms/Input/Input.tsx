import clsx from 'clsx'
import type { InputProps } from './Input.types'

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-4 py-3 text-lg rounded-lg',
}

export function Input({
  inputSize = 'md',
  error = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="relative flex items-center">
      {leftIcon && (
        <span className="absolute left-3 text-neutral-400 pointer-events-none">
          {leftIcon}
        </span>
      )}
      <input
        disabled={disabled}
        className={clsx(
          'w-full border bg-brand-800 text-neutral-100 placeholder-neutral-500',
          'transition-colors duration-150 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-500 focus:ring-red-400'
            : 'border-surface-border focus:border-primary-400 focus:ring-primary-400',
          'disabled:bg-brand-900 disabled:text-neutral-500 disabled:cursor-not-allowed',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          sizeClasses[inputSize],
          className
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-3 text-neutral-400 pointer-events-none">
          {rightIcon}
        </span>
      )}
    </div>
  )
}
