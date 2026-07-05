import type { ReactNode, SelectHTMLAttributes } from 'react'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: SelectSize
  error?: boolean
  children: ReactNode
}
