import type { HTMLAttributes, ReactNode, ElementType } from 'react'

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' | 'mono'
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
export type TextColor = 'default' | 'muted' | 'primary' | 'error' | 'success'

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  variant?: TextVariant
  weight?: TextWeight
  color?: TextColor
  children: ReactNode
}
