import { Text, Badge } from '@afwilto/design-system'
import type { MSTResult } from '@/application/ports/IGraphAlgoService'

interface MSTResultViewProps {
  result: MSTResult
}

export function MSTResultView({ result }: MSTResultViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Text variant="h4" color="default">Minimum Spanning Tree</Text>
        <Badge variant="success" size="sm">Total weight: {result.totalWeight}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {result.edges.map((e, i) => (
          <Badge key={i} variant="success" size="sm">
            {e.from + 1} — {e.to + 1} ({e.weight})
          </Badge>
        ))}
        {result.edges.length === 0 && (
          <Text variant="caption" color="muted">No MST edges (single vertex graph)</Text>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">#</Text>
              </th>
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">From</Text>
              </th>
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">To</Text>
              </th>
              <th className="py-2 pl-3 text-left">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">Weight</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.edges.map((e, i) => (
              <tr key={i} className="border-b border-surface-border last:border-0">
                <td className="py-2 pl-3">
                  <Text variant="small" color="muted">{i + 1}</Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color="default">{e.from + 1}</Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color="default">{e.to + 1}</Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color="default">{e.weight}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
