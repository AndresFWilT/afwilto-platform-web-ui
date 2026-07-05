import type { CSSProperties, ReactNode } from 'react'

export interface TagProps {
  children: ReactNode
  /** Renders a dismiss control when provided. */
  onDismiss?: () => void
  /** Dynamic colors (e.g. category accents) go through style, never bg- classes. */
  style?: CSSProperties
  className?: string
}
