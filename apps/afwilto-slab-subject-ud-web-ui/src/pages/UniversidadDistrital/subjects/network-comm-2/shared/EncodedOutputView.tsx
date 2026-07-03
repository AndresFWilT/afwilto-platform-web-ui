import { Card, Text } from '@afwilto/design-system'
import type { CodeEntry, EncodingStats } from '@/application/ports/IEncodingService'

interface EncodedOutputViewProps {
  inputText: string
  codeTable: CodeEntry[]
  stats: EncodingStats
  colorMap: Map<string, string>
}

export function EncodedOutputView({ inputText, codeTable, stats, colorMap }: EncodedOutputViewProps) {
  const codeMap = new Map(codeTable.map((e) => [e.symbol, e.code]))

  const chars = [...inputText]

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Encoded Output</Text>
      <Text variant="caption" color="muted">
        Each character's bits shown in its color. Total: {stats.compressedBitCount} bits.
      </Text>

      <div className="flex flex-wrap gap-1">
        {chars.map((ch, i) => {
          const code  = codeMap.get(ch) ?? ''
          const color = colorMap.get(ch) ?? 'var(--color-neutral-300)'
          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span
                className="text-xs font-mono px-1 py-0.5 rounded"
                style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
              >
                {ch === ' ' ? '·' : ch}
              </span>
              <span className="font-mono text-xs tracking-widest" style={{ color }}>
                {code}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 p-3 rounded-lg font-mono text-xs break-all leading-relaxed"
        style={{ backgroundColor: 'var(--color-surface-overlay)' }}>
        {[...inputText].map((ch, i) => {
          const code  = codeMap.get(ch) ?? ''
          const color = colorMap.get(ch) ?? 'var(--color-neutral-300)'
          return (
            <span key={i} style={{ color }}>{code}</span>
          )
        })}
      </div>
    </Card>
  )
}
