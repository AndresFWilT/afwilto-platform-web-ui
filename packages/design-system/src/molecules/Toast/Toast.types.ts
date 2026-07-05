import type { ReactNode } from 'react'

export type ToastVariant = 'success' | 'error'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

export interface ToastProviderProps {
  children: ReactNode
  /** Auto-dismiss delay in ms. */
  duration?: number
}
