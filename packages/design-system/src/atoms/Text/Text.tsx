import clsx from 'clsx'
import type { TextProps } from './Text.types'

const variantMap: Record<string, { tag: string; classes: string }> = {
  h1: { tag: 'h1', classes: 'text-4xl font-bold leading-tight tracking-tight' },
  h2: { tag: 'h2', classes: 'text-3xl font-bold leading-tight' },
  h3: { tag: 'h3', classes: 'text-2xl font-semibold leading-snug' },
  h4: { tag: 'h4', classes: 'text-xl font-semibold leading-snug' },
  body: { tag: 'p', classes: 'text-base leading-normal' },
  small: { tag: 'p', classes: 'text-sm leading-normal' },
  caption: { tag: 'span', classes: 'text-xs leading-normal' },
  mono: { tag: 'code', classes: 'text-sm font-mono' },
}

const weightClasses: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const colorClasses: Record<string, string> = {
  default: 'text-neutral-100',
  muted: 'text-neutral-400',
  primary: 'text-primary-400',
  error: 'text-red-400',
  success: 'text-green-400',
}

export function Text({
  as,
  variant = 'body',
  weight,
  color = 'default',
  children,
  className,
  ...props
}: TextProps) {
  const { tag, classes } = variantMap[variant]
  const Tag = (as ?? tag) as React.ElementType

  return (
    <Tag
      className={clsx(
        classes,
        weight ? weightClasses[weight] : undefined,
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
