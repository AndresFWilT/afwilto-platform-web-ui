import { FormField } from '@afwilto/design-system'
import type { OptimizationType } from '@/application/ports/IGraphicalMethodService'

interface Props {
  c1: string
  c2: string
  type: OptimizationType
  intX: boolean
  intY: boolean
  onChange: (field: 'c1' | 'c2' | 'type' | 'intX' | 'intY', value: string | boolean) => void
}

export function ObjectiveFunctionInput({ c1, c2, type, intX, intY, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <span className="text-neutral-400 text-sm pb-2 font-mono">Z =</span>

        <FormField label="c₁ (x coeff)" id="gm-c1" type="number" value={c1} inputSize="sm"
          onChange={e => onChange('c1', e.target.value)} className="w-24" />

        <span className="text-neutral-500 text-sm pb-2">· x  +</span>

        <FormField label="c₂ (y coeff)" id="gm-c2" type="number" value={c2} inputSize="sm"
          onChange={e => onChange('c2', e.target.value)} className="w-24" />

        <span className="text-neutral-500 text-sm pb-2">· y</span>

        <div className="flex flex-col gap-1 pb-0">
          <span className="text-xs text-neutral-400">Type</span>
          <select
            value={type}
            onChange={e => onChange('type', e.target.value)}
            className="bg-surface-raised border border-surface-border text-neutral-100 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-primary-400"
          >
            <option value="MAXIMIZE">Maximize</option>
            <option value="MINIMIZE">Minimize</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={intX} onChange={e => onChange('intX', e.target.checked)}
            className="accent-primary-400 w-4 h-4" />
          <span className="text-sm text-neutral-400">x ∈ ℤ (integer)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={intY} onChange={e => onChange('intY', e.target.checked)}
            className="accent-primary-400 w-4 h-4" />
          <span className="text-sm text-neutral-400">y ∈ ℤ (integer)</span>
        </label>
      </div>
    </div>
  )
}
