import { Text, Badge } from '@afwilto/design-system'
import type { BucketHead } from '@/application/ports/IHashDispersionService'

interface BucketHeadsTableProps {
  bucketHeads: BucketHead[]
  highlightModule?: number
}

export function BucketHeadsTable({ bucketHeads, highlightModule }: BucketHeadsTableProps) {
  if (bucketHeads.length === 0) {
    return <Text variant="small" color="muted">No entries dispersed yet.</Text>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="py-2 pl-3 text-left w-20">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Module</Text>
            </th>
            <th className="py-2 pl-3 text-left w-20">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Head pos</Text>
            </th>
            <th className="py-2 pl-3 text-left">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Chain (keys)</Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {bucketHeads.map(bh => {
            const isActive = highlightModule === bh.module
            return (
              <tr
                key={bh.module}
                className={`border-b border-surface-border last:border-0 ${isActive ? 'bg-primary-900/30' : ''}`}
              >
                <td className="py-2 pl-3">
                  <Text variant="small" color="default" weight={isActive ? 'bold' : 'normal'}
                    className={`font-mono ${isActive ? 'text-primary-400' : 'text-neutral-400'}`}>
                    {bh.module}
                  </Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color="muted" className="font-mono">{bh.headPosition}</Text>
                </td>
                <td className="py-2 pl-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {bh.chain.map((key, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-neutral-600 text-xs">→</span>}
                        <Badge variant={isActive ? 'primary' : 'neutral'} size="sm">
                          {key}
                        </Badge>
                      </span>
                    ))}
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
