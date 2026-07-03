import { Text } from '@afwilto/design-system'
import type { ExpansionStep } from '@/application/ports/IAStarService'

interface CostRow {
  vertexId: string
  pathCost: number
  heuristic: number
  totalEstimate: number
  action: string
}

interface Props {
  steps: ExpansionStep[]
  currentStepIndex: number
}

export function CostTable({ steps, currentStepIndex }: Props) {
  const visibleSteps = steps.slice(0, currentStepIndex + 1)
  const seen = new Map<string, CostRow>()

  for (const s of visibleSteps) {
    seen.set(s.vertexId, {
      vertexId: s.vertexId,
      pathCost: s.pathCost,
      heuristic: s.heuristic,
      totalEstimate: s.totalEstimate,
      action: s.action,
    })
  }

  const rows = [...seen.values()].sort((a, b) => a.totalEstimate - b.totalEstimate)
  const currentVertex = steps[currentStepIndex]?.vertexId

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Text variant="small" weight="semibold" color="default">Cost Table (g / h / f)</Text>
        <Text variant="caption" color="muted">No vertices expanded yet</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="semibold" color="default">Cost Table</Text>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-neutral-500 border-b border-surface-border">
              <th className="text-left py-1 pr-3">Vertex</th>
              <th className="text-right py-1 pr-3">g(n)</th>
              <th className="text-right py-1 pr-3">h(n)</th>
              <th className="text-right py-1 pr-3">f(n)</th>
              <th className="text-left py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isCurrent = row.vertexId === currentVertex
              return (
                <tr
                  key={row.vertexId}
                  className={`border-b border-surface-border/30 ${isCurrent ? 'text-warning-400' : 'text-neutral-300'}`}
                >
                  <td className="py-1 pr-3 font-bold">{row.vertexId}</td>
                  <td className="text-right py-1 pr-3">{row.pathCost.toFixed(1)}</td>
                  <td className="text-right py-1 pr-3">{row.heuristic.toFixed(1)}</td>
                  <td className="text-right py-1 pr-3 font-semibold">{row.totalEstimate.toFixed(1)}</td>
                  <td className="py-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      row.action === 'GOAL_REACHED' ? 'bg-error-500/20 text-error-400' :
                      row.action === 'EXPANDED' ? 'bg-success-500/20 text-success-400' :
                      'bg-surface-overlay text-neutral-400'
                    }`}>
                      {row.action === 'GOAL_REACHED' ? '★' : row.action === 'EXPANDED' ? '✓' : '⌚'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
