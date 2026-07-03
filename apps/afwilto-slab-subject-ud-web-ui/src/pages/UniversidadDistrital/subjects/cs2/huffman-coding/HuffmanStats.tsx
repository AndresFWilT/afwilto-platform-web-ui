import { Card, Text } from '@afwilto/design-system'
import type { EncodingStats } from '@/application/ports/IHuffmanService'

interface HuffmanStatsProps {
  stats: EncodingStats
}

export function HuffmanStats({ stats }: HuffmanStatsProps) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text variant="h4" color="default">Compression Stats</Text>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Original" value={`${stats.originalBitCount}`} unit="bits" />
        <StatBox label="Compressed" value={`${stats.compressedBitCount}`} unit="bits" />
        <StatBox label="Savings" value={`${stats.savingsPercent.toFixed(1)}`} unit="%" accent />
        <StatBox label="Ratio" value={`${stats.compressionRatio.toFixed(1)}`} unit="%" accent />
      </div>
    </Card>
  )
}

function StatBox({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-surface-border bg-surface-overlay py-3 px-2 gap-1">
      <Text variant="caption" color="muted" className="text-xs uppercase tracking-widest">{label}</Text>
      <span className="flex items-baseline gap-1">
        <span className={`text-xl font-bold font-mono ${accent ? 'text-primary-400' : 'text-neutral-100'}`}>
          {value}
        </span>
        <Text variant="caption" color="muted">{unit}</Text>
      </span>
    </div>
  )
}
