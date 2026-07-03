import { Text, Badge } from '@afwilto/design-system'
import type { TraversalResult } from '@/application/ports/IGraphTraversalService'

interface TraversalOrderViewProps {
  result: TraversalResult
}

export function TraversalOrderView({ result }: TraversalOrderViewProps) {
  const algoColor = result.algorithm === 'BFS' ? 'primary' : 'success'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
          {result.algorithm} Traversal Order
        </Text>
        <Badge variant={algoColor} size="sm">
          {result.traversalOrder.length} vertices visited
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {result.traversalOrder.map((v, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="text-neutral-600 text-xs font-mono">→</span>
            )}
            <Badge
              variant={v === result.source ? algoColor : 'neutral'}
              size="sm"
            >
              {v + 1}
            </Badge>
          </span>
        ))}
      </div>
    </div>
  )
}
