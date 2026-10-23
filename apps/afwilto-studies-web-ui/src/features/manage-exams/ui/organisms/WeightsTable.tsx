import { Button, Input, Text } from '@afwilto/design-system'
import type { Classification } from '@/exams/domain'

interface Props {
  primary: Classification
  weights: Record<string, string>
  sum: number
  problem?: string
  onChange: (categoryId: string, value: string) => void
  onResetToInferred: () => void
  busy: boolean
}

/** The primary weights with their live sum (Σ = 100 enables saving) and the way back to inferred weights. */
export function WeightsTable({ primary, weights, sum, problem, onChange, onResetToInferred, busy }: Props) {
  return (
    <section aria-label="Pesos" className="flex flex-col gap-2">
      <Text variant="h3" color="default">Pesos de «{primary.name}»</Text>
      <ul className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
        {primary.categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2">
            <span className="text-neutral-100">{c.name}</span>
            <div className="w-24">
              <Input inputSize="sm" type="number" min={0} max={100} step={1} aria-label={`Peso de «${c.name}»`} value={weights[c.id] ?? ''} error={Boolean(problem)} onChange={(e) => onChange(c.id, e.target.value)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span aria-live="polite" className={sum === 100 ? 'text-sm text-green-400' : 'text-sm text-amber-300'}>
          Suma: {sum} / 100
        </span>
        {primary.weightMode === 'manual' && (
          <Button size="sm" variant="ghost" onClick={onResetToInferred} loading={busy}>Volver a inferidos</Button>
        )}
      </div>
      {problem && <Text variant="caption" color="error" role="alert">{problem}</Text>}
    </section>
  )
}
