import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
}
