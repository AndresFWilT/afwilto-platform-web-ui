import { Link } from 'react-router-dom'
import { Badge, Card, Text } from '@afwilto/design-system'
import type { Certification } from '@/application/ports'

const STATUS_LABEL: Record<Certification['status'], string> = {
  obtained: 'Obtained',
  'in-progress': 'In Progress',
  planned: 'Planned',
}

const STATUS_BADGE: Record<Certification['status'], 'success' | 'warning' | 'neutral'> = {
  obtained: 'success',
  'in-progress': 'warning',
  planned: 'neutral',
}

export function CertCard({ cert }: { cert: Certification }) {
  return (
    <Link to={`/certifications/${cert.slug}`} className="group block h-full">
      <Card padding="lg" className="flex h-full flex-col gap-4 group-hover:-translate-y-1 transition-all duration-200">
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl select-none">{cert.icon}</span>
          <Badge variant={STATUS_BADGE[cert.status]} size="sm">
            {STATUS_LABEL[cert.status]}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <Text variant="h4" color="default" className="leading-tight">{cert.name}</Text>
          <Text variant="caption" color="muted">{cert.provider}</Text>
        </div>
        <Text variant="small" color="muted" className="leading-relaxed flex-1">
          {cert.description}
        </Text>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border">
          {cert.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
          ))}
        </div>
        <Text variant="caption" color="muted">
          {cert.status === 'obtained'
            ? `Obtained ${cert.obtainedDate}`
            : cert.targetDate
              ? `Target ${cert.targetDate}`
              : ''}
        </Text>
      </Card>
    </Link>
  )
}
