import { Badge } from '@afwilto/design-system'
import type { CertificationStatus } from '@/application/ports'

const LABELS: Record<CertificationStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  achieved: 'Achieved',
  expired: 'Expired',
  abandoned: 'Abandoned',
}

const VARIANTS: Record<CertificationStatus, 'neutral' | 'warning' | 'success' | 'error'> = {
  planned: 'neutral',
  in_progress: 'warning',
  achieved: 'success',
  expired: 'error',
  abandoned: 'neutral',
}

interface StatusBadgeProps {
  status: CertificationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={VARIANTS[status]} size="sm">
      {LABELS[status]}
    </Badge>
  )
}
