import clsx from 'clsx'
import type { CardProps } from './Card.types'

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  padding = 'md',
  shadow = true,
  border = true,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface-raised rounded-lg',
        border && 'border border-surface-border',
        shadow && 'shadow-lg',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
