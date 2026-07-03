import { Card, Text } from '@afwilto/design-system'
import type { CodeEntry } from '@/application/ports/IEncodingService'

const PALETTE = [
  '#f87171','#fb923c','#fbbf24','#34d399',
  '#60a5fa','#a78bfa','#f472b6','#2dd4bf',
  '#94a3b8','#e879f9',
]

interface CodeTableViewProps {
  entries: CodeEntry[]
  colorMap: Map<string, string>
}

export function CodeTableView({ entries, colorMap }: CodeTableViewProps) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text variant="h4" color="default">Code Table</Text>
      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              {['Symbol', 'Code', 'Bits'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const color = colorMap.get(entry.symbol) ?? PALETTE[0]
              return (
                <tr key={entry.symbol} className="border-b border-surface-border/50">
                  <td className="py-2 px-3">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-sm"
                      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
                    >
                      {entry.symbol === ' ' ? '·' : entry.symbol}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-neutral-200 text-sm tracking-wider">
                    {entry.code.split('').map((bit, i) => (
                      <span key={i} style={{ color: bit === '0' ? 'var(--color-neutral-300)' : color }}>
                        {bit}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 px-3 font-mono text-neutral-400 text-sm">
                    {entry.bitLength}
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

export { PALETTE }
