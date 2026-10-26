interface Props {
  name: string
  correct: number
  total: number
  percent: number
}

/** "Security 12/20 (60%)" as text, with a bar for the eye (the text carries the meaning). */
export function BreakdownBar({ name, correct, total, percent }: Props) {
  const tone = percent >= 70 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <li className="flex flex-col gap-1">
      <span className="text-sm text-neutral-100">{`${name} ${correct}/${total} (${Math.round(percent)}%)`}</span>
      <span aria-hidden="true" className="block h-2 w-full overflow-hidden rounded bg-surface-border">
        <span className={`block h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </span>
    </li>
  )
}
