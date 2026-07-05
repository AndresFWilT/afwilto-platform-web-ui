import type { TextareaHTMLAttributes } from 'react'

export type TextareaSize = 'sm' | 'md' | 'lg'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  textareaSize?: TextareaSize
  error?: boolean
}
