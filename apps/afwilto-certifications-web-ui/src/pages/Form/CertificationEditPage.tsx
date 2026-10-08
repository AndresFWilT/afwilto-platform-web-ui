import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Skeleton, Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useToast } from '@afwilto/design-system'
import type { Certification, Category } from '@/application/ports'
import { CertificationForm, type FormValues } from './CertificationForm'
import { buildUpdatePatch } from './buildUpdatePatch'
import { takePendingCategoryPath } from './formDraft'

function certToFormValues(cert: Certification): FormValues {
  return {
    name: cert.name,
    status: cert.status,
    categoryPath: cert.category?.path ?? '',
    studyStartDate: cert.studyStartDate ?? '',
    expectedExamDate: cert.expectedExamDate ?? '',
    achievedDate: cert.achievedDate ?? '',
    evidenceUrl: cert.evidenceUrl ?? '',
    notes: cert.notes ?? '',
  }
}

export function CertificationEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()

  const [cert, setCert] = useState<Certification | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [pendingCategoryPath, setPendingCategoryPath] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const pending = takePendingCategoryPath()
    Promise.all([
      certificationJourneyService.getById(id),
      certificationJourneyService.listCategories(),
    ])
      .then(([c, cats]) => {
        if (!c) { setNotFound(true) } else { setCert(c) }
        setCategories(cats)
        setPendingCategoryPath(pending)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  function handleRequestNewCategory() {
    navigate('/certifications/categories/new', { state: { returnTo: location.pathname } })
  }

  async function handleSubmit(values: FormValues) {
    // The loaded certification is the diff baseline: only what the user actually
    // changed is sent (Spec 14 BR-PATCH1).
    const baseline = certToFormValues(cert!)
    try {
      await certificationJourneyService.update(
        id!,
        buildUpdatePatch(baseline, values, cert!.evidenceUrlSource),
      )
      showToast('Certification updated', 'success')
      navigate('..')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update certification'
      showToast(msg, 'error')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mx-auto max-w-2xl flex flex-col gap-4">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-10 w-full rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div>
        <div className="mx-auto max-w-2xl">
          <Alert variant="error" title="Certification not found">
            The certification you are trying to edit does not exist.
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <Text as="h1" variant="h2">
          Edit Certification
        </Text>
        {cert && (
          <CertificationForm
            initialValues={
              pendingCategoryPath
                ? { ...certToFormValues(cert), categoryPath: pendingCategoryPath }
                : certToFormValues(cert)
            }
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate('..')}
            onRequestNewCategory={handleRequestNewCategory}
            submitLabel="Save"
          />
        )}
      </div>
    </div>
  )
}
