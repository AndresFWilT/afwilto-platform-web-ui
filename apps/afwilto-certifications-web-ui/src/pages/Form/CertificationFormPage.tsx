import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useToast } from '@afwilto/design-system'
import type { Category } from '@/application/ports'
import { CertificationForm, type FormValues } from './CertificationForm'
import { loadAndClearDraft, saveDraft, takePendingCategoryPath } from './formDraft'

// BR-EV1-CLIENT (Spec 14): evidence is only sent for an achieved certification.
// The form keeps the values of the evidence fields while they are hidden, so a
// user who selects "achieved", types a URL and then picks another status must
// not have that value submitted — the backend would reject it.
function buildCreateCommand(values: FormValues) {
  const achieved = values.status === 'achieved'
  return {
    name: values.name.trim(),
    status: values.status,
    categoryPath: values.categoryPath.trim() || undefined,
    studyStartDate: values.studyStartDate || undefined,
    expectedExamDate: values.expectedExamDate || undefined,
    achievedDate: achieved ? values.achievedDate || undefined : undefined,
    evidenceUrl: achieved ? values.evidenceUrl.trim() || undefined : undefined,
    notes: values.notes.trim() || undefined,
  }
}

export function CertificationFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])

  // Restored once, synchronously, on first mount: a draft saved right before
  // navigating to /categories/new, merged with the just-created category's
  // path so it comes back pre-selected — the round trip must not strand the
  // rest of an in-progress form (the one piece of client-side persistence
  // this feature introduces).
  const [initialValues] = useState<Partial<FormValues> | undefined>(() => {
    const draft = loadAndClearDraft()
    const pendingCategoryPath = takePendingCategoryPath()
    if (draft) return pendingCategoryPath ? { ...draft, categoryPath: pendingCategoryPath } : draft
    return pendingCategoryPath ? { categoryPath: pendingCategoryPath } : undefined
  })

  useEffect(() => {
    certificationJourneyService.listCategories().then(setCategories).catch(() => {})
  }, [])

  function handleRequestNewCategory(values: FormValues) {
    saveDraft(values)
    navigate('/certifications/categories/new', { state: { returnTo: location.pathname } })
  }

  async function handleSubmit(values: FormValues) {
    try {
      await certificationJourneyService.create(buildCreateCommand(values))
      showToast('Certification created', 'success')
      navigate('..')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create certification'
      showToast(msg, 'error')
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <Text as="h1" variant="h2">
          New Certification
        </Text>
        <CertificationForm
          initialValues={initialValues}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => navigate('..')}
          onRequestNewCategory={handleRequestNewCategory}
          submitLabel="Create"
        />
      </div>
    </div>
  )
}
