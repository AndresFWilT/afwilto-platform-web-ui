import type { InputHTMLAttributes, ReactNode } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
  error?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}
