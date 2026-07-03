import { Text } from '@afwilto/design-system'
import type { FrontierEntry } from '@/application/ports/IAStarService'

interface Props {
  frontier: FrontierEntry[]
}

export function FrontierPanel({ frontier }: Props) {
  if (frontier.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Frontier (Priority Queue)</Text>
        <Text variant="caption" color="muted">Empty</Text>
      </div>
    )
  }

  const sorted = [...frontier].sort((a, b) => a.totalEstimate - b.totalEstimate)

  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="semibold" color="default">
        Frontier (Priority Queue) — {frontier.length} {frontier.length === 1 ? 'entry' : 'entries'}
      </Text>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-neutral-500 border-b border-surface-border">
              <th className="text-left py-1 pr-3">Vertex</th>
              <th className="text-right py-1 pr-3">g(n)</th>
              <th className="text-right py-1 pr-3">h(n)</th>
              <th className="text-right py-1">f(n)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr
                key={entry.vertexId}
                className={`border-b border-surface-border/40 ${i === 0 ? 'text-primary-300' : 'text-neutral-300'}`}
              >
                <td className="py-1 pr-3 font-bold">{entry.vertexId}</td>
                <td className="text-right py-1 pr-3 text-neutral-400">{entry.pathCost.toFixed(1)}</td>
                <td className="text-right py-1 pr-3 text-neutral-400">{entry.heuristic.toFixed(1)}</td>
                <td className="text-right py-1 font-semibold">{entry.totalEstimate.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Text variant="caption" color="muted">
        ↑ Next to expand: <span className="text-primary-300 font-mono font-bold">{sorted[0]?.vertexId}</span>
      </Text>
    </div>
  )
}
