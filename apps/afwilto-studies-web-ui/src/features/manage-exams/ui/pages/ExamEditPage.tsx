import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, EmptyState, Input, Select, Text, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { CLASSIFICATION_NAME_MAX, checkDraft, draftFrom, primaryClassification, violationProblems, type Exam, type ExamDraft } from '@/exams/domain'
import { ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '@/exams/application/ports'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { CategoryRows } from '../organisms/CategoryRows'
import { ExamParametersFields } from '../organisms/ExamParametersFields'
import { MergeCategories } from '../organisms/MergeCategories'
import { WeightsTable } from '../organisms/WeightsTable'
import { ManageExamTemplate } from '../templates/ManageExamTemplate'

const PARAM_FIELDS = ['name', 'questionCount', 'timeLimitMin', 'passPercent'] as const
const STALE = 'The exam changed while you were editing it. Reload to see the latest version.'

export function ExamEditPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const [revision, setRevision] = useState(0)
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId, revision])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Exam not found" description="It may have been deleted." />
    ) : (
      <LoadError error={exam.error} title="Could not load the exam" />
    )
  }
  return <EditForm initial={exam.data} onReload={() => setRevision((n) => n + 1)} />
}

function EditForm({ initial, onReload }: { initial: Exam; onReload: () => void }) {
  const { examsService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  // `base` is what the server holds (and its version); `draft` is what the user has typed.
  const [base, setBase] = useState(initial)
  const [draft, setDraft] = useState<ExamDraft>(() => draftFrom(initial))
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<string>()
  const [stale, setStale] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const check = checkDraft(base, draft)
  const errors = { ...check.problems, ...serverErrors }
  const paramErrors = Object.fromEntries(PARAM_FIELDS.flatMap((f) => (errors[f] ? [[f, errors[f]]] : [])))
  const primary = primaryClassification(base)
  const swapped = primary !== undefined && draft.primaryId !== null && draft.primaryId !== primary.id
  const edit = (change: (d: ExamDraft) => ExamDraft) => {
    setServerErrors({})
    setAlert(undefined)
    setDraft(change)
  }

  async function save() {
    if (!check.patch) return
    setSaving(true)
    setServerErrors({})
    setAlert(undefined)
    try {
      await examsService.updateExam(base.id, check.patch)
      showToast('Changes saved', 'success')
      navigate(`/studies/exams/${base.id}`)
    } catch (e) {
      if (e instanceof ExamsConflictError && e.rule === 'stale_version') setStale(true)
      else if (e instanceof ExamsConflictError && e.rule === 'duplicate_name') {
        if (e.field === 'name') setServerErrors({ name: 'An exam with that name already exists' })
        else setAlert(e.field === 'classifications' ? 'A classification with that name already exists.' : 'A category with that name already exists in its classification.')
      } else if (e instanceof ExamsValidationError) {
        // Each violation lands on its field (parameters, names, pace rows, weights); the rest is one alert.
        const { problems, unmapped } = violationProblems(check.patch, e.details)
        setServerErrors(problems)
        if (unmapped.length) setAlert(unmapped.join('; '))
      } else if (e instanceof ExamsNotFoundError) setAlert('The exam no longer exists.')
      else setAlert(e instanceof Error ? e.message : String(e))
      setSaving(false)
    }
  }

  async function resetWeights() {
    setResetting(true)
    setAlert(undefined)
    try {
      const updated = await examsService.updateExam(base.id, { version: base.version, weightMode: 'inferred' })
      setBase(updated)
      setDraft((d) => ({ ...d, weights: draftFrom(updated).weights }))
      showToast('Weights inferred again', 'success')
    } catch (e) {
      if (e instanceof ExamsConflictError && e.rule === 'stale_version') setStale(true)
      else setAlert(e instanceof Error ? e.message : String(e))
    } finally {
      setResetting(false)
    }
  }

  async function merge(fromId: string, intoId: string) {
    const merged = await examsService.mergeCategories(base.id, { from: fromId, into: intoId })
    setBase(merged)
    setDraft((d) => ({ ...draftFrom(merged), params: d.params, classificationNames: d.classificationNames, primaryId: d.primaryId }))
    showToast('Categories merged', 'success')
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <ManageExamTemplate back={{ to: `/studies/exams/${base.id}`, label: base.name }} title="Edit exam" width="form">

      <section aria-label="Parameters" className="flex max-w-xl flex-col gap-4">
        <ExamParametersFields values={draft.params} errors={paramErrors} onChange={(field, value) => edit((d) => ({ ...d, params: { ...d.params, [field]: value } }))} disabled={saving} />
      </section>

      {base.classifications.length === 0 ? (
        <Text variant="body" color="muted">Import questions to define classifications, weights and pace.</Text>
      ) : (
        <>
          <section aria-label="Classifications" className="flex max-w-xl flex-col gap-3">
            <Text variant="h3" color="default">Classifications</Text>
            {base.classifications.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <Input
                  aria-label={`Name of the ${c.position === 0 ? 'primary' : 'secondary'} classification`}
                  maxLength={CLASSIFICATION_NAME_MAX}
                  value={draft.classificationNames[c.id] ?? ''}
                  error={Boolean(errors[`classification:${c.id}`])}
                  onChange={(e) => edit((d) => ({ ...d, classificationNames: { ...d.classificationNames, [c.id]: e.target.value } }))}
                />
                {errors[`classification:${c.id}`] && <Text variant="caption" color="error" role="alert">{errors[`classification:${c.id}`]}</Text>}
              </div>
            ))}
            {base.classifications.length === 2 && (
              <div className="flex flex-col gap-1">
                <label htmlFor="primary-classification" className="text-sm text-neutral-300">Primary classification</label>
                <Select id="primary-classification" value={draft.primaryId ?? ''} onChange={(e) => edit((d) => ({ ...d, primaryId: e.target.value }))}>
                  {base.classifications.map((c) => <option key={c.id} value={c.id}>{draft.classificationNames[c.id] || c.name}</option>)}
                </Select>
              </div>
            )}
          </section>

          {primary && !swapped && (
            <WeightsTable
              primary={primary}
              weights={draft.weights}
              sum={check.weightsSum}
              problem={errors.weights}
              busy={resetting}
              onChange={(id, value) => edit((d) => ({ ...d, weights: { ...d.weights, [id]: value } }))}
              onResetToInferred={() => void resetWeights()}
            />
          )}
          {swapped && <Text variant="body" color="muted">Weights are inferred again when the primary classification changes.</Text>}

          {base.classifications.map((c) => (
            <section key={c.id} aria-label={`Categories of ${c.name}`} className="flex flex-col gap-2">
              <Text variant="h3" color="default">Categories of “{c.name}”</Text>
              <CategoryRows
                classification={c}
                draft={draft}
                problems={errors}
                onChange={(id, field, value) => edit((d) => ({ ...d, categories: { ...d.categories, [id]: { ...d.categories[id], [field]: value } } }))}
              />
              {c.categories.length >= 2 && <MergeCategories classification={c} onMerge={(from, into) => merge(from.id, into.id)} />}
            </section>
          ))}
        </>
      )}

      {stale && (
        <Alert variant="warning">
          {STALE}
          <span className="ml-2"><Button size="sm" variant="secondary" onClick={onReload}>Reload</Button></span>
        </Alert>
      )}
      {alert && <Alert variant="error">{alert}</Alert>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!check.patch} loading={saving}>Save changes</Button>
        <ButtonLink to={`/studies/exams/${base.id}`} variant="ghost">Cancel</ButtonLink>
      </div>
      </ManageExamTemplate>
    </form>
  )
}
