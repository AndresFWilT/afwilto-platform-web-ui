import { Card, Text } from '@afwilto/design-system'
import type { EncodingStats } from '@/application/ports/IEncodingService'

interface CompressionStatsCardProps {
  stats: EncodingStats
}

export function CompressionStatsCard({ stats }: CompressionStatsCardProps) {
  const encodedPct = 100 - stats.savingsPercent
  const savedPct   = stats.savingsPercent

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <Text variant="h4" color="default">Compression</Text>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Original</Text>
          <span className="font-mono font-bold text-neutral-200">{stats.originalBitCount} bits</span>
          <Text variant="caption" color="muted">({stats.originalBitCount / 8} chars × 8)</Text>
        </div>
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">Compressed</Text>
          <span className="font-mono font-bold text-primary-400">{stats.compressedBitCount} bits</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-neutral-400">
          <span>Encoded</span>
          <span className="font-mono text-primary-400 font-bold">{encodedPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-overlay)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${encodedPct}%`, backgroundColor: 'var(--color-primary-400)' }}
          />
        </div>

        <div className="flex justify-between text-xs text-neutral-400">
          <span>Saved</span>
          <span className="font-mono text-green-400 font-bold">{savedPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-overlay)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${savedPct}%`, backgroundColor: 'var(--color-success-400)' }}
          />
        </div>
      </div>
    </Card>
  )
}
