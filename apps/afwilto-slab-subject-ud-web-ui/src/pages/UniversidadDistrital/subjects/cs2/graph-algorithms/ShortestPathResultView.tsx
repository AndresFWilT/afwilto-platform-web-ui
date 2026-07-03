import { Text, Badge } from '@afwilto/design-system'
import type { ShortestPathResult } from '@/application/ports/IGraphAlgoService'

interface ShortestPathResultViewProps {
  result: ShortestPathResult
}

export function ShortestPathResultView({ result }: ShortestPathResultViewProps) {
  const vertices = Object.keys(result.distances)
    .map(Number)
    .sort((a, b) => a - b)

  const reachable = vertices.filter(v => result.distances[String(v)] !== -1).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Text variant="h4" color="default">Shortest Paths from vertex {result.source + 1}</Text>
        <Badge variant="primary" size="sm">{reachable}/{vertices.length} reachable</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">Vertex</Text>
              </th>
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">Distance</Text>
              </th>
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">Parent</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {vertices.map(v => {
              const dist   = result.distances[String(v)]
              const parent = result.parents[String(v)]
              const isSource = v === result.source
              return (
                <tr key={v} className="border-b border-surface-border last:border-0">
                  <td className="py-2 pl-3">
                    <Text variant="small" color="default" weight={isSource ? 'bold' : 'normal'}
                      className={isSource ? 'text-primary-400' : ''}>
                      {v + 1}{isSource ? ' (source)' : ''}
                    </Text>
                  </td>
                  <td className="py-2 pl-3">
                    <Text variant="small" color={dist === -1 ? 'muted' : 'default'}>
                      {dist === -1 ? '∞' : dist === 0 ? '0' : dist}
                    </Text>
                  </td>
                  <td className="py-2 pl-3">
                    <Text variant="small" color="muted">
                      {isSource ? '—' : parent !== undefined ? parent + 1 : '—'}
                    </Text>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Text variant="caption" color="muted">Shortest-path tree edges:</Text>
        {result.shortestPathTree.map((e, i) => (
          <Badge key={i} variant="primary" size="sm">
            {e.from + 1} → {e.to + 1} ({e.weight})
          </Badge>
        ))}
        {result.shortestPathTree.length === 0 && (
          <Text variant="caption" color="muted">none (single vertex or no edges)</Text>
        )}
      </div>
    </div>
  )
}
