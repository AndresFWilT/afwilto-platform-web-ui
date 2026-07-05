import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  /** Call-to-action slot (typically a Button or link). */
  action?: ReactNode
}
