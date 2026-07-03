import { useState } from 'react'
import { Card, Text, Button } from '@afwilto/design-system'
import type { ActivityInput as ActivityInputType } from '@/application/ports/ICriticalPathService'
import { EXAMPLE_ACTIVITIES, type ActivityRow } from './types'

interface ActivityInputProps {
  disabled: boolean
  onCompute: (activities: ActivityInputType[]) => void
}

let nextId = 9

export function ActivityInput({ disabled, onCompute }: ActivityInputProps) {
  const [rows, setRows] = useState<ActivityRow[]>(EXAMPLE_ACTIVITIES)

  const addRow = () => {
    setRows(prev => [...prev, { id: nextId++, name: '', duration: '1', predecessors: '' }])
  }

  const removeRow = (id: number) => setRows(prev => prev.filter(r => r.id !== id))

  const update = (id: number, field: keyof ActivityRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const handleCompute = () => {
    const activities: ActivityInputType[] = rows.map(r => ({
      name: r.name.trim(),
      duration: parseInt(r.duration) || 1,
      predecessors: r.predecessors.trim()
        ? r.predecessors.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }))
    onCompute(activities)
  }

  const cell = 'px-2 py-1 text-sm font-mono rounded outline-none transition-colors'
  const cellStyle = {
    backgroundColor: 'var(--color-surface-overlay)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-neutral-100)',
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Text variant="h4" color="default">Activities</Text>
          <Text variant="caption" color="muted">Predecessors: comma-separated names, e.g. A,B</Text>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRows(EXAMPLE_ACTIVITIES)}>
          Load example
        </Button>
      </div>

      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ minWidth: '460px' }}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 px-2 text-left text-xs text-neutral-500 w-28">Name</th>
                <th className="py-2 px-2 text-left text-xs text-neutral-500 w-24">Duration</th>
                <th className="py-2 px-2 text-left text-xs text-neutral-500">Predecessors</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-surface-border/30">
                  <td className="py-1 px-1">
                    <input value={row.name} onChange={e => update(row.id, 'name', e.target.value)}
                      className={`${cell} w-full`} style={cellStyle} placeholder="A" />
                  </td>
                  <td className="py-1 px-1">
                    <input type="number" min={1} value={row.duration} onChange={e => update(row.id, 'duration', e.target.value)}
                      className={`${cell} w-full`} style={cellStyle} />
                  </td>
                  <td className="py-1 px-1">
                    <input value={row.predecessors} onChange={e => update(row.id, 'predecessors', e.target.value)}
                      className={`${cell} w-full`} style={cellStyle} placeholder="A,B" />
                  </td>
                  <td className="py-1 px-1 text-center">
                    <button onClick={() => removeRow(row.id)}
                      className="text-neutral-600 hover:text-red-400 transition-colors text-sm font-bold px-1">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={addRow}>+ Add activity</Button>
        <Button variant="primary" disabled={disabled || rows.length === 0} onClick={handleCompute}>
          Compute CPM →
        </Button>
      </div>
    </Card>
  )
}
