import { Text, Badge, Card } from '@afwilto/design-system'
import { CHROMATIC_PALETTE } from './palette'
import { GraphCanvas } from './GraphCanvas'
import type { UIVertex } from './types'
import type { ChromaticEstimate } from '@/application/ports/IChromaticGraphService'

interface ColoredResultProps {
  vertices: UIVertex[]
  matrix: number[][]
  result: ChromaticEstimate
}

export function ColoredResult({ vertices, matrix, result }: ColoredResultProps) {
  // Build a vertex→colorName map grouped by color for the legend
  const groups = new Map<number, number[]>()
  for (const vc of result.vertexColors) {
    const arr = groups.get(vc.colorIndex) ?? []
    arr.push(vc.vertexId + 1)  // 1-based for display
    groups.set(vc.colorIndex, arr)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-0.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">χ estimate</Text>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-primary-400">{result.colorsUsed}</span>
            <Text variant="small" color="muted">colors</Text>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Traversal order</Text>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {result.traversalOrder.map((v, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="font-mono text-sm text-neutral-100 bg-brand-700 border border-surface-border px-2 py-0.5 rounded-md">
                  {v + 1}
                </span>
                {i < result.traversalOrder.length - 1 && (
                  <span className="text-neutral-600 text-xs">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Colored graph + legend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph — same scroll window as the builder (positions are in 1400×500 space) */}
        <Card
          padding="none"
          className="lg:col-span-2 relative overflow-hidden"
          style={{ height: '300px', backgroundColor: 'var(--color-brand-50)' }}
        >
          <div className="overflow-auto w-full h-full" style={{ scrollbarWidth: 'thin' }}>
            <GraphCanvas
              vertices={vertices}
              matrix={matrix}
              vertexColors={result.vertexColors}
              highlightOrder={result.traversalOrder}
            />
          </div>
        </Card>

        {/* Color legend */}
        <Card padding="md" className="flex flex-col gap-3">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Color assignment
          </Text>
          <div className="flex flex-col gap-2">
            {Array.from(groups.entries()).sort(([a], [b]) => a - b).map(([colorIdx, vIds]) => (
              <div key={colorIdx} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-full shrink-0 border border-black/20"
                  style={{ backgroundColor: CHROMATIC_PALETTE[colorIdx] }}
                />
                <div className="flex flex-wrap gap-1">
                  {vIds.map(vid => (
                    <Badge key={vid} variant="neutral" size="sm">{vid}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
