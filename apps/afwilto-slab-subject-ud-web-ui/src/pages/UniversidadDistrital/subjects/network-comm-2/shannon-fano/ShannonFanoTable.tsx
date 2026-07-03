import { Card, Text } from '@afwilto/design-system'
import type { ShannonFanoEntry, ShannonFanoTotals } from '@/application/ports/IEncodingService'
import { PALETTE } from '../shared/CodeTableView'

interface ShannonFanoTableProps {
  entries: ShannonFanoEntry[]
  totals: ShannonFanoTotals
  colorMap: Map<string, string>
}

export function ShannonFanoTable({ entries, totals, colorMap }: ShannonFanoTableProps) {
  const headers = ['Symbol', 'Freq', 'P(x)', 'Entropy', 'H·f', 'Code', 'Bits', 'Msg bits']

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text variant="h4" color="default">Shannon-Fano Table</Text>
      <div className="overflow-auto" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full border-collapse text-sm" style={{ minWidth: '560px' }}>
          <thead>
            <tr className="border-b border-surface-border">
              {headers.map(h => (
                <th key={h} className="py-2 px-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const color = colorMap.get(entry.symbol) ?? PALETTE[i % PALETTE.length]
              return (
                <tr key={entry.symbol} className="border-b border-surface-border/40">
                  <td className="py-1.5 px-2">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded font-mono font-bold text-sm"
                      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
                    >
                      {entry.symbol === ' ' ? '·' : entry.symbol}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-mono text-neutral-300">{entry.frequency}</td>
                  <td className="py-1.5 px-2 font-mono text-neutral-400 text-xs">{entry.probability.toFixed(3)}</td>
                  <td className="py-1.5 px-2 font-mono text-amber-400 text-xs">{entry.entropy.toFixed(3)}</td>
                  <td className="py-1.5 px-2 font-mono text-amber-400/70 text-xs">{entry.messageEntropy.toFixed(3)}</td>
                  <td className="py-1.5 px-2 font-mono text-sm tracking-wider" style={{ color }}>
                    {entry.code}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-neutral-400 text-xs">{entry.codeBitLength}</td>
                  <td className="py-1.5 px-2 font-mono text-neutral-400 text-xs">{entry.messageBits}</td>
                </tr>
              )
            })}
            <tr className="border-t-2 border-surface-border bg-surface-overlay/30">
              <td className="py-1.5 px-2 font-bold text-neutral-200 text-xs uppercase">Total</td>
              <td className="py-1.5 px-2 font-mono font-bold text-neutral-200">{totals.frequency}</td>
              <td className="py-1.5 px-2 font-mono text-neutral-300 text-xs">{totals.probability.toFixed(2)}</td>
              <td className="py-1.5 px-2 font-mono text-amber-300 text-xs font-bold">{totals.entropy.toFixed(3)}</td>
              <td className="py-1.5 px-2 font-mono text-amber-300/70 text-xs font-bold">{totals.messageEntropy.toFixed(3)}</td>
              <td className="py-1.5 px-2"></td>
              <td className="py-1.5 px-2 font-mono text-neutral-300 text-xs font-bold">{totals.codeBits}</td>
              <td className="py-1.5 px-2 font-mono text-primary-400 text-xs font-bold">{totals.messageBits}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Text variant="caption" color="muted">
        H·f = entropy × frequency (message entropy contribution). Msg bits = code bits × frequency.
      </Text>
    </Card>
  )
}
