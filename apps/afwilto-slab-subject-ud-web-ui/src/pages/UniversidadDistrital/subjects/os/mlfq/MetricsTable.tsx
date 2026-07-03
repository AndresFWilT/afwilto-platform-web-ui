import { Text } from '@afwilto/design-system'
import type { MLFQProcessResult } from './types'
import { QUEUE_COLORS } from './types'

interface Props {
  results: MLFQProcessResult[]
  averageTurnaround: number
  averageWaiting: number
}

export function MetricsTable({ results, averageTurnaround, averageWaiting }: Props) {
  if (results.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <Text variant="small" weight="semibold" color="default">Process Metrics</Text>
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-xs font-mono border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-surface-border">
              {['PID', 'Burst', 'Completion', 'Turnaround', 'Waiting', 'Final Queue'].map(h => (
                <th key={h} className="py-1.5 px-2 text-left text-neutral-400 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.pid} className="border-b border-surface-border/50 hover:bg-surface-raised/50">
                <td className="py-1.5 px-2 font-bold" style={{ color: '#94a3b8' }}>P{r.pid}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.burstTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.completionTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.turnaroundTime}</td>
                <td className="py-1.5 px-2 text-neutral-300">{r.waitingTime}</td>
                <td className="py-1.5 px-2">
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                    style={{ backgroundColor: `${QUEUE_COLORS[r.finalQueue]}22`, color: QUEUE_COLORS[r.finalQueue] }}>
                    {r.finalQueue === 'RoundRobin' ? 'RR' : r.finalQueue === 'ShortestJobFirst' ? 'SJF' : 'FCFS'}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-surface-border bg-surface-raised/30">
              <td colSpan={3} className="py-1.5 px-2 text-neutral-400 font-semibold">Average</td>
              <td className="py-1.5 px-2 text-primary-400 font-bold">{averageTurnaround.toFixed(2)}</td>
              <td className="py-1.5 px-2 text-primary-400 font-bold">{averageWaiting.toFixed(2)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
