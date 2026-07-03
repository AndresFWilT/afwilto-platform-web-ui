import type { HTMLAttributes, ReactNode } from 'react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant: AlertVariant
  title?: string
  children: ReactNode
  onClose?: () => void
}
