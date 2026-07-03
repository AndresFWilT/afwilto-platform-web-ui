import { Text, Badge } from '@afwilto/design-system'
import type { TopologicalSortResult } from '@/application/ports/ITopologicalSortService'

interface TopologicalOrderViewProps {
  result: TopologicalSortResult
}

export function TopologicalOrderView({ result }: TopologicalOrderViewProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
          Topological Order
        </Text>
        <Badge variant="primary" size="sm">
          {result.topologicalOrder.length} vertices
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {result.topologicalOrder.map((v, i) => {
          const inDeg = result.inDegrees.find(d => d.vertex === v)?.initialInDegree ?? 0
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-neutral-600 text-xs font-mono">→</span>}
              <div className="flex flex-col items-center gap-0.5">
                <Badge variant="primary" size="sm">{v + 1}</Badge>
                <Text variant="caption" color="muted" className="font-mono text-xs">d={inDeg}</Text>
              </div>
            </span>
          )
        })}
      </div>
    </div>
  )
}
