import { Card, Text } from '@afwilto/design-system'
import type { ShortestPathInfo } from '@/application/ports/ILCRSService'

interface ShortestPathResultProps {
  result: ShortestPathInfo | null
  traversal: { order: string; sequence: { label: string; weight: number }[] } | null
}

export function ShortestPathResult({ result, traversal }: ShortestPathResultProps) {
  if (!result && !traversal) return null

  return (
    <Card padding="md" className="flex flex-col gap-4">
      {result && (
        <div className="flex flex-col gap-2">
          <Text variant="h4" color="default">Shortest Root-to-Leaf Path</Text>
          <div className="flex flex-wrap items-center gap-2">
            {result.path.map((label, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-400 text-white font-mono font-bold text-sm">
                  {label}
                </span>
                {i < result.path.length - 1 && (
                  <span className="text-neutral-400 font-mono text-xs">
                    —{result.pathWeights[i]}→
                  </span>
                )}
              </span>
            ))}
          </div>
          <Text variant="caption" color="muted">
            Leaf: <span className="font-mono text-neutral-100">{result.leaf}</span> ·
            Total weight: <span className="font-mono text-neutral-100">{result.totalWeight}</span>
          </Text>
        </div>
      )}

      {traversal && (
        <div className="flex flex-col gap-2">
          <Text variant="h4" color="default">
            {traversal.order.charAt(0) + traversal.order.slice(1).toLowerCase()} Traversal
          </Text>
          <div className="flex flex-wrap gap-1">
            {traversal.sequence.map((step, i) => (
              <span key={i} className="flex flex-col items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-surface-overlay border border-surface-border">
                  <Text variant="mono" color="default">{step.label}</Text>
                </span>
                {step.weight > 0 && (
                  <Text variant="caption" color="muted" className="text-xs">{step.weight}</Text>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
