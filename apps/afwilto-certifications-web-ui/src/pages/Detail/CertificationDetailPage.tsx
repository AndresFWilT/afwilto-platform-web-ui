import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Skeleton, Text } from '@afwilto/design-system'
import { useCertification } from '@/hooks/useCertification'
import { StatusBadge } from '@/pages/shared/StatusBadge'
import { CategoryPill } from '@/pages/shared/CategoryPill'

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64 rounded" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <Text as="dt" variant="small" color="muted" className="sm:w-40 shrink-0">
        {label}
      </Text>
      <Text as="dd" variant="body">
        {value}
      </Text>
    </div>
  )
}

export function CertificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { certification, loading, error } = useCertification(id ?? '')

  return (
    <div className="min-h-screen bg-surface-base px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">

        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
          ← Back
        </Button>

        {loading && <DetailSkeleton />}

        {error && (
          <Alert variant="error" title="Failed to load certification">
            {error.message}
          </Alert>
        )}

        {!loading && !error && certification === null && (
          <Alert variant="warning" title="Certification not found">
            The certification you are looking for does not exist or has been removed.
          </Alert>
        )}

        {!loading && !error && certification && (
          <>
            <div className="flex flex-col gap-2">
              <Text as="h1" variant="h2">
                {certification.name}
              </Text>
              <div className="flex items-center gap-3">
                <StatusBadge status={certification.status} />
                {certification.category && (
                  <CategoryPill path={certification.category.path} />
                )}
              </div>
            </div>

            <Card padding="md">
              <dl className="flex flex-col gap-4">
                {certification.studyStartDate && (
                  <DetailRow label="Study start" value={certification.studyStartDate} />
                )}
                {certification.expectedExamDate && (
                  <DetailRow label="Exam date" value={certification.expectedExamDate} />
                )}
                {certification.achievedDate && (
                  <DetailRow label="Achieved" value={certification.achievedDate} />
                )}
                {certification.notes && (
                  <DetailRow label="Notes" value={certification.notes} />
                )}
                {certification.evidenceUrl && (
                  <DetailRow
                    label="Evidence"
                    value={
                      <a
                        href={certification.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 underline underline-offset-2"
                      >
                        View evidence
                      </a>
                    }
                  />
                )}
                <DetailRow
                  label="Created"
                  value={new Date(certification.createdAt).toLocaleDateString()}
                />
              </dl>
            </Card>

            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={() => navigate(`../${certification.id}/edit`)}>
                Edit
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
