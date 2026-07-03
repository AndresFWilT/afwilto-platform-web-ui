import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Badge, Spinner } from '@afwilto/design-system'
import type { Certification } from '@/application/ports'
import { useServices } from '@/di'
import { CertCard } from '@/pages/shared/CertCard'

export function CatalogPage() {
  const { certificationService } = useServices()
  const [catalog, setCatalog] = useState<Certification[] | null>(null)

  useEffect(() => {
    void certificationService.getCatalog().then(setCatalog)
  }, [certificationService])

  return (
    <BaseLayout>
      <div className="flex flex-col gap-10">
        <section className="flex flex-col items-center text-center gap-4 py-10">
          <Badge variant="primary" size="md">Certifications</Badge>
          <Text variant="h1" color="default">Certification Catalog</Text>
          <Text variant="body" color="muted" className="max-w-2xl">
            Credentials obtained so far. The path ahead lives in the roadmap.
          </Text>
          <Link to="/certifications/roadmap">
            <Button variant="secondary">View Roadmap →</Button>
          </Link>
        </section>

        {catalog === null ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalog.map((cert) => (
              <CertCard key={cert.slug} cert={cert} />
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
