import { Alert, Text } from '@afwilto/design-system'
import { countLabel } from '@/shared/lib/format'
import type { SessionPreview } from '@/exams/domain'

export type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: SessionPreview }
  | { status: 'error'; error: Error }

/** "Hay 84 preguntas · se tomarán 20", or what is missing for the simulation. */
export function PreviewSummary({ preview }: { preview: PreviewState }) {
  if (preview.status === 'idle') return <Text variant="small" color="muted">Completa la selección para ver cuántas preguntas hay.</Text>
  if (preview.status === 'loading') return <Text variant="small" color="muted">Calculando…</Text>
  if (preview.status === 'error') {
    return <Alert variant="error" title="No se pudo calcular la vista previa">{preview.error.message}</Alert>
  }
  const { poolSize, drawCount, shortages } = preview.data
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <Text variant="body" color="default">{`Hay ${countLabel(poolSize, 'pregunta', 'preguntas')} · se ${drawCount === 1 ? 'tomará' : 'tomarán'} ${drawCount}`}</Text>
      {shortages.length > 0 && (
        <Alert variant="error" title="No hay preguntas suficientes para este simulacro">
          <ul className="list-disc pl-5">
            {shortages.map((s) => (
              <li key={s.category}>{`faltan ${s.needed - s.available} en ${s.category}`}</li>
            ))}
          </ul>
        </Alert>
      )}
    </div>
  )
}
