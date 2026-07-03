import { Card, Text } from '@afwilto/design-system'
import type { HuffmanCodeEntry } from '@/application/ports/IHuffmanService'

interface HuffmanEncodedOutputProps {
  text: string
  codeTable: HuffmanCodeEntry[]
  colorMap: Map<string, string>
}

interface Segment {
  symbol: string
  code: string
  color: string
}

export function HuffmanEncodedOutput({ text, codeTable, colorMap }: HuffmanEncodedOutputProps) {
  if (!codeTable.length) return null

  const codeBySymbol = new Map(codeTable.map((e) => [e.symbol, e.code]))
  const segments: Segment[] = Array.from(text).map((ch) => ({
    symbol: ch,
    code: codeBySymbol.get(ch) ?? '?',
    color: colorMap.get(ch) ?? '#3b82f6',
  }))

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Encoded Output</Text>
        <Text variant="caption" color="muted">
          Each symbol is colored consistently with its leaf in the Huffman tree.
        </Text>
      </div>

      <div className="overflow-auto rounded border border-surface-border bg-surface-overlay p-3">
        {/* Symbol alignment row */}
        <div className="flex flex-wrap gap-0 mb-1">
          {segments.map((seg, i) => (
            <span key={i} className="flex flex-col items-center"
              style={{ minWidth: `${Math.max(seg.code.length, 1) * 9 + 4}px` }}>
              <span className="font-mono text-xs font-bold" style={{ color: seg.color }}>
                {seg.symbol === ' ' ? '·' : seg.symbol}
              </span>
            </span>
          ))}
        </div>
        {/* Bits row */}
        <div className="flex flex-wrap gap-0">
          {segments.map((seg, i) => (
            <span key={i} className="font-mono text-xs tracking-wider"
              style={{
                color: seg.color,
                minWidth: `${Math.max(seg.code.length, 1) * 9 + 4}px`,
              }}>
              {seg.code}
            </span>
          ))}
        </div>
      </div>

      <Text variant="caption" color="muted">
        Total: <span className="font-mono text-neutral-100">{segments.reduce((s, seg) => s + seg.code.length, 0)}</span> bits
        for <span className="font-mono text-neutral-100">{text.length}</span> characters
      </Text>
    </Card>
  )
}
