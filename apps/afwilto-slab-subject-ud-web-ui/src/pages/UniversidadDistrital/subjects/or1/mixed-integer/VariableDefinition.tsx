import { Button, Text, FormField } from '@afwilto/design-system'
import type { VariableRow } from './types'

interface Props {
  variables: VariableRow[]
  onChange: (index: number, field: keyof VariableRow, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function VariableDefinition({ variables, onChange, onAdd, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="medium" color="muted">Variables</Text>
      {variables.map((v, i) => (
        <div key={i} className="flex items-end gap-3">
          <FormField label={i === 0 ? 'Name' : ' '} id={`mip-vname-${i}`}
            value={v.name} inputSize="sm"
            onChange={e => onChange(i, 'name', e.target.value)} className="w-20" />

          <div className={`flex flex-col gap-1 ${i === 0 ? '' : 'pb-0'}`}>
            {i === 0 && <span className="text-xs text-neutral-400">Type</span>}
            <select
              value={v.type}
              onChange={e => onChange(i, 'type', e.target.value)}
              className="bg-surface-raised border border-surface-border text-neutral-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-primary-400"
            >
              <option value="CONTINUOUS">Continuous</option>
              <option value="INTEGER">Integer</option>
            </select>
          </div>

          {variables.length > 1 && (
            <button onClick={() => onRemove(i)}
              className="text-neutral-500 hover:text-error-400 text-sm pb-2 transition-colors"
              title="Remove">✕</button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={onAdd} className="self-start">
        + Add variable
      </Button>
    </div>
  )
}
