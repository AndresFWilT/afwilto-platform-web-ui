import { Text } from '@afwilto/design-system'
import type { AttemptResult } from '@/exams/domain'
import { formatDuration, formatScore } from '@/shared/lib/format'

/** The score, pass/fail for simulations only, the count and the duration. */
export function ScoreSummary({ result }: { result: AttemptResult }) {
  return (
    <section aria-label="Summary" className="flex flex-col gap-2 rounded-lg border border-surface-border bg-surface-raised p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl font-bold text-neutral-100">{formatScore(result.scorePercent)}</span>
        {result.passed !== null && (
          <span className={`text-lg font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>{result.passed ? 'Passed' : 'Not passed'}</span>
        )}
      </div>
      <Text variant="small" color="muted">This is the raw percentage of correct answers, not the provider's scaled score.</Text>
      <div className="flex flex-wrap gap-x-4 text-sm text-neutral-300">
        <span>{`${result.correctCount} of ${result.total} correct`}</span>
        <span>{`Duration: ${formatDuration(result.durationSeconds)}`}</span>
      </div>
    </section>
  )
}
