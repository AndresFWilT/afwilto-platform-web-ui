import clsx from 'clsx'
import type { TagProps } from './Tag.types'

export function Tag({ children, onDismiss, style, className }: TagProps) {
  return (
    <span
      style={style}
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-brand-700 text-neutral-100 border border-surface-border',
        className
      )}
    >
      {children}
      {onDismiss && (
        <button
          type="button"
          aria-label="Remove filter"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-100 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-400 rounded-full leading-none"
        >
          ×
        </button>
      )}
    </span>
  )
}
