import { Card, Text, Badge } from '@afwilto/design-system'
import type { CriticalPathResult } from '@/application/ports/ICriticalPathService'

interface ScheduleTableProps {
  result: CriticalPathResult
}

export function ScheduleTable({ result }: ScheduleTableProps) {
  const headers = ['Activity', 'Predecessors', 'Duration', 'ES', 'EF', 'LS', 'LF', 'Slack', 'Critical']

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Text variant="h4" color="default">Schedule</Text>
        <span className="font-mono text-sm text-neutral-300">
          Project duration: <span className="text-primary-400 font-bold">{result.projectDuration}</span>
        </span>
        <div className="flex items-center gap-1 text-sm text-neutral-400">
          Critical path:
          {result.criticalPath.map((name, i) => (
            <span key={name}>
              {i > 0 && <span className="text-neutral-600 mx-0.5">→</span>}
              <span className="font-mono font-bold text-red-400">{name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse text-sm" style={{ minWidth: '640px' }}>
          <thead>
            <tr className="border-b border-surface-border">
              {headers.map(h => (
                <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.schedule.map(a => (
              <tr key={a.name}
                className="border-b border-surface-border/40 transition-colors"
                style={a.isCritical ? { backgroundColor: 'rgba(248,113,113,0.07)' } : undefined}>
                <td className="py-1.5 px-2 font-mono font-bold"
                  style={{ color: a.isCritical ? 'var(--color-error-400)' : 'var(--color-neutral-200)' }}>
                  {a.name}
                </td>
                <td className="py-1.5 px-2 font-mono text-neutral-400 text-xs">
                  {a.predecessors.length ? a.predecessors.join(', ') : '—'}
                </td>
                <td className="py-1.5 px-2 font-mono text-neutral-300">{a.duration}</td>
                <td className="py-1.5 px-2 font-mono text-blue-400">{a.earlyStart}</td>
                <td className="py-1.5 px-2 font-mono text-blue-400">{a.earlyFinish}</td>
                <td className="py-1.5 px-2 font-mono text-violet-400">{a.lateStart}</td>
                <td className="py-1.5 px-2 font-mono text-violet-400">{a.lateFinish}</td>
                <td className="py-1.5 px-2 font-mono"
                  style={{ color: a.slack === 0 ? 'var(--color-error-400)' : 'var(--color-success-400)' }}>
                  {a.slack}
                </td>
                <td className="py-1.5 px-2">
                  {a.isCritical
                    ? <Badge variant="error" size="sm">YES</Badge>
                    : <span className="text-xs text-neutral-600">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Text variant="caption" color="muted">
        ES=Early Start · EF=Early Finish · LS=Late Start · LF=Late Finish. Slack = LF − EF. Critical activities have zero slack.
      </Text>
    </Card>
  )
}
