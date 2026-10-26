import { Alert, Text } from '@afwilto/design-system'
import { countLabel } from '@/shared/lib/format'
import type { SessionPreview } from '@/exams/domain'

export type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: SessionPreview }
  | { status: 'error'; error: Error }

/** "84 questions available · 20 will be drawn", or what is missing for the simulation. */
export function PreviewSummary({ preview }: { preview: PreviewState }) {
  if (preview.status === 'idle') return <Text variant="small" color="muted">Complete the selection to see how many questions there are.</Text>
  if (preview.status === 'loading') return <Text variant="small" color="muted">Calculating…</Text>
  if (preview.status === 'error') {
    return <Alert variant="error" title="Could not calculate the preview">{preview.error.message}</Alert>
  }
  const { poolSize, drawCount, shortages } = preview.data
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <Text variant="body" color="default">{`${countLabel(poolSize, 'question', 'questions')} available · ${drawCount} will be drawn`}</Text>
      {shortages.length > 0 && (
        <Alert variant="error" title="Not enough questions for this practice exam">
          <ul className="list-disc pl-5">
            {shortages.map((s) => (
              <li key={s.category}>{`${s.needed - s.available} more needed in ${s.category}`}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
