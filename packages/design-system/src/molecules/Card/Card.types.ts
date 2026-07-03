import type { HTMLAttributes, ReactNode } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
  shadow?: boolean
  border?: boolean
  children: ReactNode
}
