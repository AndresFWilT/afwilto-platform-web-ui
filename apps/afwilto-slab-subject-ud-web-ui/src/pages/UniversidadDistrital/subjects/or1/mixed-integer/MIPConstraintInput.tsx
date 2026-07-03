import { Button, Text, FormField } from '@afwilto/design-system'
import type { ConstraintRow, VariableRow } from './types'

interface Props {
  variables: VariableRow[]
  constraints: ConstraintRow[]
  onChange: (index: number, field: 'sign' | 'rhs' | `coeff-${number}`, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function MIPConstraintInput({ variables, constraints, onChange, onAdd, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="medium" color="muted">Constraints (subject to)</Text>

      {constraints.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          {variables.map((v, j) => (
            <div key={j} className="flex items-end gap-1">
              <FormField
                label={i === 0 ? v.name : ' '}
                id={`mip-coeff-${i}-${j}`}
                type="number"
                value={row.coefficients[j] ?? '0'}
                inputSize="sm"
                onChange={e => onChange(i, `coeff-${j}`, e.target.value)}
                className="w-20"
              />
              {j < variables.length - 1 && (
                <span className="text-neutral-500 text-sm pb-2">+</span>
              )}
            </div>
          ))}

          <div className={`flex flex-col gap-1`}>
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

          <FormField label={i === 0 ? 'RHS' : ' '} id={`mip-rhs-${i}`}
            type="number" value={row.rhs} inputSize="sm"
            onChange={e => onChange(i, 'rhs', e.target.value)} className="w-24" />

          {constraints.length > 1 && (
            <button onClick={() => onRemove(i)}
              className="text-neutral-500 hover:text-error-400 text-sm pb-2 transition-colors"
              title="Remove">✕</button>
          )}
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={onAdd} className="self-start">
        + Add constraint
      </Button>
    </div>
  )
}
