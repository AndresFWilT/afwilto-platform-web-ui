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

/** Classes of the interactive element, by state. */
export function itemClasses(selected: boolean, inert: boolean): string {
  const tone = selected ? 'border-primary-500 bg-primary-500/10' : 'border-surface-border bg-surface-raised'
  const cursor = inert ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary-500/60'
  return `rounded-lg border p-3 ${tone} ${cursor}`
}

/** `media:<sha256>` → the bare hash; anything else is not servable. */
export function shaOf(image: string | undefined): string | null {
  return image?.startsWith('media:') ? image.slice('media:'.length) : null
}
