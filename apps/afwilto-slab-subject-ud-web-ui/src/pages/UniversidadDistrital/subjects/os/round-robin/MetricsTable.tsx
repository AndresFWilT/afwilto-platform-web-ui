import { Text } from '@afwilto/design-system'
import type { ProcessResult } from './types'
import { processColor } from './types'

interface Props {
  results: ProcessResult[]
  averageTurnaround: number
  averageWaiting: number
}

export function MetricsTable({ results, averageTurnaround, averageWaiting }: Props) {
  if (results.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">Process Metrics</Text>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-xs font-mono border-collapse min-w-[420px]">
          <thead>
            <tr className="border-b border-surface-border">
              {['PID', 'Burst', 'Completion', 'Turnaround', 'Waiting'].map(h => (
                <th key={h} className="py-1.5 px-2 text-left text-neutral-400 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.pid} className="border-b border-surface-border/50 hover:bg-surface-raised/50">
                <td className="py-1.5 px-2">
                  <span className="font-bold" style={{ color: processColor(r.pid) }}>P{r.pid}</span>
                </td>
                <td className="py-1.5 px-2 text-neutral-300">{r.burstTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.completionTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.turnaroundTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.waitingTime}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-surface-border bg-surface-raised/30">
              <td className="py-1.5 px-2 text-neutral-400 font-semibold" colSpan={3}>Average</td>
              <td className="py-1.5 px-2 text-primary-400 font-bold">{averageTurnaround.toFixed(2)}</td>
              <td className="py-1.5 px-2 text-primary-400 font-bold">{averageWaiting.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
