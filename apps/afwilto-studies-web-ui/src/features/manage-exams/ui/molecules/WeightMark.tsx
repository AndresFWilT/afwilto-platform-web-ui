import { Badge } from '@afwilto/design-system'
import type { WeightMode } from '@/exams/domain'

/** "inferido" (from the bank) or "manual" (set by hand), in text, never colour alone. */
export function WeightMark({ mode }: { mode: WeightMode }) {
  return <Badge size="sm" variant={mode === 'manual' ? 'primary' : 'neutral'}>{mode === 'manual' ? 'manual' : 'inferido'}</Badge>
}
