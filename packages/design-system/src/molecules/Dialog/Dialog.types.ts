import type { ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Action row rendered below the content (buttons). */
  footer?: ReactNode
}
