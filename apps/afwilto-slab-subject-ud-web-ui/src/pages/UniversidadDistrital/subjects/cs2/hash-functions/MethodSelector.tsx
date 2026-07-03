import { Text } from '@afwilto/design-system'
import type { HashMethod } from '@/application/ports/IHashFunctionService'
import { ALL_METHODS, METHOD_LABELS } from './types'

interface MethodSelectorProps {
  value: HashMethod
  onChange: (method: HashMethod) => void
  disabled?: boolean
}

export function MethodSelector({ value, onChange, disabled }: MethodSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">Method</Text>
      <div className="flex flex-wrap gap-2">
        {ALL_METHODS.map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            disabled={disabled}
            className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              value === m
                ? 'border-primary-500 bg-primary-600 text-white'
                : 'border-surface-border bg-surface-overlay text-neutral-400 hover:text-neutral-100 hover:border-neutral-500'
            }`}
          >
            {METHOD_LABELS[m]}
          </button>
        ))}
      </div>
    </div>
  )
}
