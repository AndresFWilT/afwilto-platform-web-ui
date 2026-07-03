import { Text } from '@afwilto/design-system'
import type { Slot } from '@/application/ports/IHashDispersionService'

interface DataArrayTableProps {
  dataArray: Slot[]
  nextAvailable: number
  highlightPositions?: number[]
}

export function DataArrayTable({ dataArray, nextAvailable, highlightPositions }: DataArrayTableProps) {
  const highlightSet = new Set(highlightPositions ?? [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="py-2 pl-3 text-left w-16">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Pos</Text>
            </th>
            <th className="py-2 pl-3 text-left w-20">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Key</Text>
            </th>
            <th className="py-2 pl-3 text-left w-24">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Value</Text>
            </th>
            <th className="py-2 pl-3 text-left">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">Next cursor</Text>
            </th>
          </tr>
        </thead>
        <tbody>
          {dataArray.map(slot => {
            const isEmpty = slot.key === 0
            const isNext  = slot.position === nextAvailable
            const isHighlighted = highlightSet.has(slot.position)

            let rowClass = 'border-b border-surface-border last:border-0'
            if (isHighlighted)    rowClass += ' bg-green-900/30'
            else if (isEmpty)     rowClass += ' opacity-50'

            return (
              <tr key={slot.position} className={rowClass}>
                <td className="py-2 pl-3">
                  <span className="flex items-center gap-1.5">
                    <Text variant="small" color="muted" className="font-mono">{slot.position}</Text>
                    {isNext && (
                      <span className="text-xs text-yellow-400 font-mono" title="next available">→free</span>
                    )}
                  </span>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color={isEmpty ? 'muted' : 'default'} className="font-mono">
                    {isEmpty ? '—' : slot.key}
                  </Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color={isEmpty ? 'muted' : 'default'}>
                    {isEmpty ? '—' : slot.value || '—'}
                  </Text>
                </td>
                <td className="py-2 pl-3">
                  <Text variant="small" color="muted" className="font-mono">
                    {slot.nextCursor === 0 ? '∅' : `→ ${slot.nextCursor}`}
                  </Text>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
