import { Button, Text, FormField } from '@afwilto/design-system'
import type { ConstraintRow } from './types'

interface Props {
  constraints: ConstraintRow[]
  onChange: (index: number, field: keyof ConstraintRow, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ConstraintListInput({ constraints, onChange, onAdd, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="medium" color="muted">Constraints (subject to)</Text>

      {constraints.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <FormField label={i === 0 ? 'a (x coeff)' : ' '} id={`gm-a-${i}`}
            type="number" value={row.a} inputSize="sm"
            onChange={e => onChange(i, 'a', e.target.value)} className="w-24" />

          <span className="text-neutral-500 text-sm pb-2">· x +</span>

          <FormField label={i === 0 ? 'b (y coeff)' : ' '} id={`gm-b-${i}`}
            type="number" value={row.b} inputSize="sm"
            onChange={e => onChange(i, 'b', e.target.value)} className="w-24" />

          <div className={`flex flex-col gap-1 ${i === 0 ? '' : 'pb-0'}`}>
            {i === 0 && <span className="text-xs text-neutral-400">Sign</span>}
            <select
              value={row.sign}
              onChange={e => onChange(i, 'sign', e.target.value)}
              className="bg-surface-raised border border-surface-border text-neutral-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-primary-400"
            >
              <option value="LE">≤</option>
              <option value="GE">≥</option>
              <option value="EQ">=</option>
            </select>
          </div>

          <FormField label={i === 0 ? 'RHS' : ' '} id={`gm-rhs-${i}`}
            type="number" value={row.rhs} inputSize="sm"
            onChange={e => onChange(i, 'rhs', e.target.value)} className="w-24" />

          {constraints.length > 1 && (
            <button
              onClick={() => onRemove(i)}
              className="text-neutral-500 hover:text-error-400 text-sm pb-2 transition-colors"
              title="Remove constraint"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={onAdd} className="self-start">
        + Add constraint
      </Button>
    </div>
  )
}
