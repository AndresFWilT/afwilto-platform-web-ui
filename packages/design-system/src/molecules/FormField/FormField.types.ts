import type { ReactNode } from 'react'
import type { InputProps } from '../../atoms/Input'

export interface FormFieldProps extends InputProps {
  label: string
  id: string
  helperText?: string
  errorMessage?: string
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}
