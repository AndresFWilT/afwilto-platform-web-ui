import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BaseLayout, Text, Button, Badge, Card, Spinner } from '@afwilto/design-system'
import type { Certification } from '@/application/ports'
import { useServices } from '@/di'

type LoadState =
  | { status: 'loading' }
  | { status: 'found'; cert: Certification }
  | { status: 'not-found' }

export function CertDetailPage() {
  const { certSlug } = useParams<{ certSlug: string }>()
  const { certificationService } = useServices()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!certSlug) {
      setState({ status: 'not-found' })
      return
    }
    void certificationService.getBySlug(certSlug).then((cert) => {
      setState(cert ? { status: 'found', cert } : { status: 'not-found' })
    })
  }, [certificationService, certSlug])

  if (state.status === 'loading') {
    return (
      <BaseLayout>
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      </BaseLayout>
    )
  }

  if (state.status === 'not-found') {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Certification not found</Text>
          <Link to="/certifications">
            <Button variant="secondary">← Back to Catalog</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  const { cert } = state

  return (
    <BaseLayout>
      <div className="flex flex-col gap-8 max-w-3xl">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/certifications" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Certifications
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{cert.name}</span>
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl select-none">{cert.icon}</span>
            <div className="flex flex-col gap-1">
              <Text variant="h1" color="default">{cert.name}</Text>
              <Text variant="body" color="muted">{cert.provider}</Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={cert.status === 'obtained' ? 'success' : cert.status === 'in-progress' ? 'warning' : 'neutral'}
              size="md"
            >
              {cert.status === 'obtained' ? 'Obtained' : cert.status === 'in-progress' ? 'In Progress' : 'Planned'}
            </Badge>
            {cert.obtainedDate && (
              <Text variant="caption" color="muted">Obtained {cert.obtainedDate}</Text>
            )}
            {cert.targetDate && (
              <Text variant="caption" color="muted">Target {cert.targetDate}</Text>
            )}
          </div>
        </div>

        <Text variant="body" color="muted" className="leading-relaxed">{cert.description}</Text>

        <Card padding="lg" className="flex flex-col gap-4">
          <Text variant="h4" color="default">Skills</Text>
          <div className="flex flex-wrap gap-2">
            {cert.skills.map((skill) => (
              <Badge key={skill} variant="primary" size="md">{skill}</Badge>
            ))}
          </div>
        </Card>

        {cert.link && (
          <a href={cert.link} target="_blank" rel="noreferrer" className="self-start">
            <Button variant="primary">View Credential ↗</Button>
          </a>
        )}
      </div>
    </BaseLayout>
  )
}
