import { Badge } from '@afwilto/design-system'
import type { Classification } from '@/application/ports/ITruthTableService'

interface ClassificationBadgeProps {
  classification: Classification
}

const CONFIG: Record<Classification, { variant: 'success' | 'error' | 'neutral'; label: string; note: string }> = {
  tautology:     { variant: 'success', label: 'Tautology',     note: 'True for all assignments' },
  contradiction: { variant: 'error',   label: 'Contradiction', note: 'False for all assignments' },
  contingency:   { variant: 'neutral', label: 'Contingency',   note: 'Mixed truth values' },
}

export function ClassificationBadge({ classification }: ClassificationBadgeProps) {
  const cfg = CONFIG[classification]
  return (
    <div className="flex items-center gap-2">
      <Badge variant={cfg.variant} size="md">{cfg.label}</Badge>
      <span className="text-xs text-neutral-500">{cfg.note}</span>
    </div>
  )
}
