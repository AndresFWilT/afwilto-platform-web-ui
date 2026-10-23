import { Text } from '@afwilto/design-system'
import type { AttemptResult } from '@/exams/domain'
import { formatDuration, formatPercent } from '@/shared/lib/format'

/** The score, pass/fail for simulations only, the count and the duration. */
export function ScoreSummary({ result }: { result: AttemptResult }) {
  return (
    <section aria-label="Resumen" className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-bold text-neutral-100">{formatPercent(result.scorePercent)}</span>
        {result.passed !== null && (
          <span className={`text-lg font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.passed ? 'Aprobado' : 'No aprobado'}</span>
        )}
      </div>
      <Text variant="small" color="muted">Es el porcentaje bruto de aciertos, no la puntuación escalada del proveedor.</Text>
      <div className="flex flex-wrap gap-x-4 text-sm text-neutral-300">
        <span>{`${result.correctCount} de ${result.total} correctas`}</span>
        <span>{`Duración: ${formatDuration(result.durationSeconds)}`}</span>
      </div>
    </section>
  )
}
