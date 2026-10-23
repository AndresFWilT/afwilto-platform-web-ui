import type { ViewOption } from '@/exams/domain'
import type { RevealMarkKind } from '../atoms/RevealMark'

/** What the two option molecules share. */
export interface OptionItemProps {
  option: ViewOption
  role: 'radio' | 'checkbox'
  selected: boolean
  /** Rendered as `aria-disabled`; the item then ignores clicks and keys. */
  inert: boolean
  mark?: RevealMarkKind
  rationale?: string
  resolveMediaUrl: (sha256: string) => string | null
  onActivate: (label: string) => void
}
