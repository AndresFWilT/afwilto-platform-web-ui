import { Text, Button, Input } from '@afwilto/design-system'
import type { MLFQQueueLevel } from './types'
import { QUEUE_COLORS, QUEUE_LABELS } from './types'
import type { ProcessRow } from './types'

interface Props {
  rows: ProcessRow[]
  quantum: number
  agingThreshold: number
  loading: boolean
  onRowChange: (id: number, field: keyof Omit<ProcessRow, 'id'>, value: string) => void
  onAddRow: () => void
  onRemoveRow: (id: number) => void
  onQuantumChange: (v: number) => void
  onAgingChange: (v: number) => void
  onSimulate: () => void
  onStartStep: () => void
}

const LEVELS: MLFQQueueLevel[] = ['RoundRobin', 'ShortestJobFirst', 'FirstComeFirstServed']

export function ProcessInput({
  rows, quantum, agingThreshold, loading,
  onRowChange, onAddRow, onRemoveRow,
  onQuantumChange, onAgingChange,
  onSimulate, onStartStep,
}: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* Config sliders */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Text variant="small" weight="semibold" color="default">
            RR Quantum: <span className="text-primary-400 font-mono">{quantum}</span>
          </Text>
          <input type="range" min={1} max={20} value={quantum}
            onChange={e => onQuantumChange(Number(e.target.value))}
            className="w-full accent-primary-500" />
        </div>
        <div className="flex flex-col gap-1">
          <Text variant="small" weight="semibold" color="default">
            Aging Threshold: <span className="text-primary-400 font-mono">{agingThreshold}</span>
          </Text>
          <input type="range" min={2} max={20} value={agingThreshold}
            onChange={e => onAgingChange(Number(e.target.value))}
            className="w-full accent-primary-500" />
        </div>
      </div>

      {/* Process table header */}
      <div className="grid grid-cols-[32px_1fr_1fr_1fr_auto] gap-1 items-center">
        <span />
        <Text variant="caption" color="muted" weight="semibold">PID</Text>
        <Text variant="caption" color="muted" weight="semibold">Burst</Text>
        <Text variant="caption" color="muted" weight="semibold">Queue</Text>
        <span />
      </div>

      {rows.map(row => (
        <div key={row.id} className="grid grid-cols-[32px_1fr_1fr_1fr_auto] gap-1 items-center">
          <span
            className="w-2 h-6 rounded-full"
            style={{ backgroundColor: QUEUE_COLORS[row.queueLevel] }}
          />
          <Input inputSize="sm" value={row.pid} placeholder="1"
            onChange={e => onRowChange(row.id, 'pid', e.target.value)} />
          <Input inputSize="sm" value={row.burstTime} placeholder="8"
            onChange={e => onRowChange(row.id, 'burstTime', e.target.value)} />
          <select
            value={row.queueLevel}
            onChange={e => onRowChange(row.id, 'queueLevel', e.target.value)}
            className="text-xs rounded px-1 py-1 bg-surface-overlay border border-surface-border text-neutral-200"
          >
            {LEVELS.map(l => (
              <option key={l} value={l}>{l === 'RoundRobin' ? 'RR' : l === 'ShortestJobFirst' ? 'SJF' : 'FCFS'}</option>
            ))}
          </select>
          <button onClick={() => onRemoveRow(row.id)}
            className="text-neutral-500 hover:text-red-400 transition-colors text-sm px-1">✕</button>
        </div>
      ))}

      <Button variant="ghost" size="sm" onClick={onAddRow}>+ Add Process</Button>

      <div className="flex gap-2 flex-col sm:flex-row">
        <Button variant="primary" size="md" loading={loading} onClick={onSimulate} fullWidth>
          Run All
        </Button>
        <Button variant="secondary" size="md" onClick={onStartStep} fullWidth>
          Step Mode
        </Button>
      </div>

      {/* Queue legend */}
      <div className="flex flex-col gap-1 pt-1 border-t border-surface-border">
        {LEVELS.map(l => (
          <div key={l} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: QUEUE_COLORS[l] }} />
            <Text variant="caption" color="muted">{QUEUE_LABELS[l]}</Text>
          </div>
        ))}
      </div>
    </div>
  )
}
