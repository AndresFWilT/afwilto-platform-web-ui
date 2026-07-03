import { Text, Badge } from '@afwilto/design-system'
import type { InDegreeInfo } from '@/application/ports/ITopologicalSortService'

interface InDegreeTableProps {
  inDegrees: InDegreeInfo[]
}

export function InDegreeTable({ inDegrees }: InDegreeTableProps) {
  const sorted = [...inDegrees].sort((a, b) => a.vertex - b.vertex)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="py-2 pl-3 text-left w-20">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Vertex</Text>
            </th>
            <th className="py-2 pl-3 text-left">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">In-Degree</Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ vertex, initialInDegree }) => {
            const isSource = initialInDegree === 0
            return (
              <tr key={vertex} className="border-b border-surface-border last:border-0">
                <td className="py-2 pl-3">
                  <Text variant="small" color="default" className="font-mono">{vertex + 1}</Text>
                </td>
                <td className="py-2 pl-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isSource ? 'success' : 'neutral'} size="sm">
                      {initialInDegree}
                    </Badge>
                    {isSource && (
                      <Text variant="caption" color="muted">source — starts the sort</Text>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
