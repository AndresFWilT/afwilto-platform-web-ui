import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Badge, Spinner } from '@afwilto/design-system'
import type { Certification } from '@/application/ports'
import { useServices } from '@/di'
import { CertCard } from '@/pages/shared/CertCard'

export function RoadmapPage() {
  const { certificationService } = useServices()
  const [roadmap, setRoadmap] = useState<Certification[] | null>(null)

  useEffect(() => {
    void certificationService.getRoadmap().then(setRoadmap)
  }, [certificationService])

  return (
    <BaseLayout>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col items-center text-center gap-4 py-10">
          <Badge variant="warning" size="md">Roadmap</Badge>
          <Text variant="h1" color="default">Learning Roadmap</Text>
          <Text variant="body" color="muted" className="max-w-2xl">
            Target certifications — currently in progress first, then planned.
          </Text>
          <Link to="/certifications">
            <Button variant="secondary">← Back to Catalog</Button>
          </Link>
        </section>

        {roadmap === null ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmap.map((cert) => (
              <CertCard key={cert.slug} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
