import { Text, Badge } from '@afwilto/design-system'
import type { GraphEdge, MSTResult } from '@/application/ports/IGraphAlgoService'
import type { KruskalEdgeStatus } from './types'

interface SortedEdgeListProps {
  edges: GraphEdge[]
  result: MSTResult
}

interface EdgeWithStatus {
  edge: GraphEdge
  status: KruskalEdgeStatus
}

function computeStatuses(inputEdges: GraphEdge[], mstEdges: GraphEdge[]): EdgeWithStatus[] {
  const sorted = [...inputEdges].sort((a, b) => a.weight - b.weight)

  const mstCounts = new Map<string, number>()
  for (const e of mstEdges) {
    const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}-${e.weight}`
    mstCounts.set(key, (mstCounts.get(key) ?? 0) + 1)
  }

  return sorted.map(e => {
    const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}-${e.weight}`
    const count = mstCounts.get(key) ?? 0
    if (count > 0) {
      mstCounts.set(key, count - 1)
      return { edge: e, status: 'accepted' }
    }
    return { edge: e, status: 'rejected' }
  })
}

export function SortedEdgeList({ edges, result }: SortedEdgeListProps) {
  const items = computeStatuses(edges, result.edges)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
          Edges sorted by weight
        </Text>
        <Badge variant="success" size="sm">Total: {result.totalWeight}</Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map(({ edge, status }, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border border-surface-border px-3 py-2">
            <span className="w-8 text-right font-mono text-sm text-neutral-400">{edge.weight}</span>
            <span className="font-mono text-sm text-neutral-200">
              {edge.from + 1} — {edge.to + 1}
            </span>
            <span className="ml-auto">
              {status === 'accepted' ? (
                <Badge variant="success" size="sm">✓ Accepted</Badge>
              ) : (
                <Badge variant="error" size="sm">✗ Rejected — cycle</Badge>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
