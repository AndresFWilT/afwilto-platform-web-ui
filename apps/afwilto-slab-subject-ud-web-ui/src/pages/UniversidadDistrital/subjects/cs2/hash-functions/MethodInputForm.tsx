import { Button, Text } from '@afwilto/design-system'
import type { HashMethod } from '@/application/ports/IHashFunctionService'

interface MethodInputFormProps {
  method: HashMethod
  key_: number
  prime: number
  bitWidth: number
  base: number
  arraySize: number
  onKeyChange:       (v: number) => void
  onPrimeChange:     (v: number) => void
  onBitWidthChange:  (v: number) => void
  onBaseChange:      (v: number) => void
  onArraySizeChange: (v: number) => void
  onCompute: () => void
  loading: boolean
}

function NumInput({ label, value, min, max, onChange, disabled, hint }: {
  label: string; value: number; min?: number; max?: number
  onChange: (v: number) => void; disabled?: boolean; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <input
        type="number"
        min={min}
        max={max}
        value={value === 0 ? '' : value}
        placeholder={hint ?? String(min ?? 0)}
        onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
        disabled={disabled}
        className="h-9 w-28 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none disabled:opacity-50"
      />
    </div>
  )
}

export function MethodInputForm({
  method, key_, prime, bitWidth, base, arraySize,
  onKeyChange, onPrimeChange, onBitWidthChange, onBaseChange, onArraySizeChange,
  onCompute, loading,
}: MethodInputFormProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Key is always shown */}
      <NumInput label="Key (integer ≥ 0)" value={key_} min={0} onChange={onKeyChange} hint="e.g. 145" />

      {method === 'DIVISION' && (
        <NumInput label="Prime modulus" value={prime} min={2} onChange={onPrimeChange} hint="e.g. 7" />
      )}

      {(method === 'MID_SQUARE' || method === 'FOLDING') && (
        <NumInput label="Bit width (1–32)" value={bitWidth} min={1} max={32} onChange={onBitWidthChange} hint="e.g. 4" />
      )}

      {method === 'TRANSFORMATION' && (
        <>
          <NumInput label="Base (2–16)" value={base} min={2} max={16} onChange={onBaseChange} hint="e.g. 11" />
          <NumInput label="Array size" value={arraySize} min={1} onChange={onArraySizeChange} hint="e.g. 100" />
        </>
      )}

      <div className="flex items-end">
        <Button
          variant="primary"
          size="md"
          onClick={onCompute}
          disabled={loading || key_ < 0}
          loading={loading}
        >
          Compute
        </Button>
      </div>
    </div>
  )
}
