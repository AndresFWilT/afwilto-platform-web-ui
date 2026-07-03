import { Text, Button, Input } from '@afwilto/design-system'
import type { ProcessRow } from './types'

interface Props {
  rows: ProcessRow[]
  timeQuantum: number
  loading: boolean
  onRowChange: (id: number, field: 'pid' | 'burstTime', value: string) => void
  onAddRow: () => void
  onRemoveRow: (id: number) => void
  onQuantumChange: (q: number) => void
  onSimulate: () => void
  onStartStep: () => void
}

export function ProcessInput({
  rows, timeQuantum, loading,
  onRowChange, onAddRow, onRemoveRow, onQuantumChange,
  onSimulate, onStartStep,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Time Quantum */}
      <div className="flex flex-col gap-1.5">
        <Text variant="small" weight="semibold" color="default">
          Time Quantum: <span className="text-primary-400 font-mono">{timeQuantum}</span>
        </Text>
        <input
          type="range"
          min={1}
          max={20}
          value={timeQuantum}
          onChange={e => onQuantumChange(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <div className="flex justify-between">
          <Text variant="caption" color="muted">1</Text>
          <Text variant="caption" color="muted">20</Text>
        </div>
      </div>

      {/* Process table */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Text variant="caption" color="muted" weight="semibold">PID</Text>
          <Text variant="caption" color="muted" weight="semibold">Burst Time</Text>
          <span />
        </div>

        {rows.map(row => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Input
              inputSize="sm"
              value={row.pid}
              placeholder="e.g. 1"
              onChange={e => onRowChange(row.id, 'pid', e.target.value)}
            />
            <Input
              inputSize="sm"
              value={row.burstTime}
              placeholder="e.g. 8"
              onChange={e => onRowChange(row.id, 'burstTime', e.target.value)}
            />
            <button
              onClick={() => onRemoveRow(row.id)}
              className="text-neutral-500 hover:text-red-400 transition-colors text-sm px-1"
              aria-label="remove"
            >
              ✕
            </button>
          </div>
        ))}

        <Button variant="ghost" size="sm" onClick={onAddRow}>
          + Add Process
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <Button variant="primary" size="md" loading={loading} onClick={onSimulate} fullWidth>
          Run All
        </Button>
        <Button variant="secondary" size="md" onClick={onStartStep} fullWidth>
          Step Mode
        </Button>
      </div>
    </div>
  )
}
