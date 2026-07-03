import { Card, Text } from '@afwilto/design-system'
import type { HuffmanCodeEntry } from '@/application/ports/IHuffmanService'

interface HuffmanCodeTableProps {
  entries: HuffmanCodeEntry[]
  colorMap: Map<string, string>
}

export function HuffmanCodeTable({ entries, colorMap }: HuffmanCodeTableProps) {
  if (entries.length === 0) return null

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text variant="h4" color="default">Code Table</Text>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="py-1 pr-4 text-left"><Text variant="caption" color="muted">Symbol</Text></th>
              <th className="py-1 pr-4 text-left"><Text variant="caption" color="muted">Freq</Text></th>
              <th className="py-1 pr-4 text-left"><Text variant="caption" color="muted">Code</Text></th>
              <th className="py-1 text-left"><Text variant="caption" color="muted">Bits</Text></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const color = colorMap.get(e.symbol) ?? '#3b82f6'
              return (
                <tr key={e.symbol} className="border-b border-surface-border/40">
                  <td className="py-1.5 pr-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-mono font-bold text-sm"
                      style={{ backgroundColor: color }}>
                      {e.symbol === ' ' ? '·' : e.symbol}
                    </span>
                  </td>
                  <td className="py-1.5 pr-4">
                    <Text variant="mono" color="muted">{e.frequency}</Text>
                  </td>
                  <td className="py-1.5 pr-4">
                    <span className="font-mono text-sm tracking-wider" style={{ color }}>
                      {e.code}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <Text variant="mono" color="muted">{e.bitLength}</Text>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
