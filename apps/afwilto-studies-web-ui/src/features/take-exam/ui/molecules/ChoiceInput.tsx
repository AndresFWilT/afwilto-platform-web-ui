import type { ReactNode } from 'react'

interface Props {
  type: 'radio' | 'checkbox'
  /** The group name of a radio. */
  name?: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  children: ReactNode
}

/** A radio or checkbox whose label is its accessible name. */
export function ChoiceInput({ type, name, checked, onChange, disabled = false, children }: Props) {
  return (
    <label className="inline-flex cursor-pointer items-start gap-2 text-sm text-neutral-100">
      <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="mt-1 accent-primary-400" />
      <span className="flex flex-col">{children}</span>
    </label>
  )
}
