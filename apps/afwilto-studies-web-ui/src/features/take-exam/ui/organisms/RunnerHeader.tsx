import { Text } from '@afwilto/design-system'
import { formatClock } from '@/exams/domain'

interface Props {
  examName: string
  position: number
  total: number
  /** Seconds left; undefined when the attempt is untimed. */
  remainingSeconds: number | undefined
}

/** The exam name, "Pregunta k de N" and, when timed, the countdown (there is no pause). */
export function RunnerHeader({ examName, position, total, remainingSeconds }: Props) {
  const urgent = remainingSeconds !== undefined && remainingSeconds <= 60
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col">
        <Text variant="small" color="muted">{examName}</Text>
        <Text variant="h3" color="default">{`Pregunta ${position + 1} de ${total}`}</Text>
      </div>
      {remainingSeconds !== undefined && (
        <span
          role="timer"
          aria-label="Tiempo restante"
          className={`rounded-md border px-3 py-1 font-mono text-lg ${urgent ? 'border-red-500 text-red-300' : 'border-surface-border text-neutral-100'}`}
        >
          {formatClock(remainingSeconds)}
        </span>
      )}
    </header>
  )
}
