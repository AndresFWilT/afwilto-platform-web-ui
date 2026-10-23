/** The A–F badge of an option. Its letter is also its accessible text. */
export function LetterBadge({ label, selected = false }: { label: string; selected?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
        selected ? 'border-primary-500 bg-primary-500 text-white' : 'border-surface-border text-neutral-300'
      }`}
    >
      {label}
    </span>
  )
}
