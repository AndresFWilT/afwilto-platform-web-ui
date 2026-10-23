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
const STALE = 'El examen cambió mientras lo editabas. Recarga para ver la última versión.'

export function ExamEditPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const [revision, setRevision] = useState(0)
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId, revision])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Examen no encontrado" description="Puede que se haya eliminado." />
    ) : (
      <LoadError error={exam.error} title="No se pudo cargar el examen" />
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
      showToast('Cambios guardados', 'success')
      navigate(`/studies/exams/${base.id}`)
    } catch (e) {
      if (e instanceof ExamsConflictError && e.rule === 'stale_version') setStale(true)
      else if (e instanceof ExamsConflictError && e.rule === 'duplicate_name') {
        if (e.field === 'name') setServerErrors({ name: 'Ya existe un examen con ese nombre' })
        else setAlert(e.field === 'classifications' ? 'Ya existe una clasificación con ese nombre.' : 'Ya existe una categoría con ese nombre en su clasificación.')
      } else if (e instanceof ExamsValidationError) {
        // Each violation lands on its field (parameters, names, pace rows, weights); the rest is one alert.
        const { problems, unmapped } = violationProblems(check.patch, e.details)
        setServerErrors(problems)
        if (unmapped.length) setAlert(unmapped.join('; '))
      } else if (e instanceof ExamsNotFoundError) setAlert('El examen ya no existe.')
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
      showToast('Pesos inferidos de nuevo', 'success')
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
    showToast('Categorías combinadas', 'success')
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <ManageExamTemplate back={{ to: `/studies/exams/${base.id}`, label: base.name }} title="Editar examen" width="form">

      <section aria-label="Parámetros" className="flex max-w-xl flex-col gap-4">
        <ExamParametersFields values={draft.params} errors={paramErrors} onChange={(field, value) => edit((d) => ({ ...d, params: { ...d.params, [field]: value } }))} disabled={saving} />
      </section>

      {base.classifications.length === 0 ? (
        <Text variant="body" color="muted">Importa preguntas para definir clasificaciones, pesos y ritmos.</Text>
      ) : (
        <>
          <section aria-label="Clasificaciones" className="flex max-w-xl flex-col gap-3">
            <Text variant="h3" color="default">Clasificaciones</Text>
            {base.classifications.map((c) => (
              <div key={c.id} className="flex flex-col gap-1">
                <Input
                  aria-label={`Nombre de la clasificación ${c.position === 0 ? 'principal' : 'secundaria'}`}
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
                <label htmlFor="primary-classification" className="text-sm text-neutral-300">Clasificación principal</label>
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
          {swapped && <Text variant="body" color="muted">Los pesos se infieren de nuevo al cambiar la clasificación principal.</Text>}

          {base.classifications.map((c) => (
            <section key={c.id} aria-label={`Categorías de ${c.name}`} className="flex flex-col gap-2">
              <Text variant="h3" color="default">Categorías de «{c.name}»</Text>
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
          <span className="ml-2"><Button size="sm" variant="secondary" onClick={onReload}>Recargar</Button></span>
        </Alert>
      )}
      {alert && <Alert variant="error">{alert}</Alert>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!check.patch} loading={saving}>Guardar cambios</Button>
        <ButtonLink to={`/studies/exams/${base.id}`} variant="ghost">Cancelar</ButtonLink>
      </div>
      </ManageExamTemplate>
    </form>
  )
}
