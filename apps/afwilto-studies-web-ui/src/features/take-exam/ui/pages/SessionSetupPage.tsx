import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, EmptyState, Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import {
  buildPreviewConfig,
  buildSessionConfig,
  editMinutes,
  initialSessionForm,
  resetMinutes,
  withSuggestedMinutes,
  type Exam,
  type SessionConfig,
  type SessionForm,
} from '@/exams/domain'
import { ExamsAttemptInProgressError, ExamsNotFoundError, ExamsValidationError } from '@/exams/application/ports'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { AttemptInProgressNotice } from '../organisms/AttemptInProgressNotice'
import { FeedbackFields } from '../organisms/FeedbackFields'
import { PreviewSummary, type PreviewState } from '../organisms/PreviewSummary'
import { SelectionFields } from '../organisms/SelectionFields'
import { TimingFields } from '../organisms/TimingFields'
import { ChoiceInput } from '../molecules/ChoiceInput'

/** Every change to the selection is previewed after this pause. */
const PREVIEW_DEBOUNCE_MS = 300

export function SessionSetupPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId])
  const bank = useAsync(() => examsService.listQuestions(examId), [examsService, examId])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Examen no encontrado" description="Puede que se haya eliminado." />
    ) : (
      <LoadError error={exam.error} title="No se pudo cargar el examen" />
    )
  }
  const sets = bank.status === 'success' ? [...new Set(bank.data.flatMap((q) => (q.origin?.set ? [q.origin.set] : [])))].sort() : []
  return <SessionSetup exam={exam.data} sets={sets} />
}

function SessionSetup({ exam, sets }: { exam: Exam; sets: string[] }) {
  const { examsService } = useServices()
  const navigate = useNavigate()
  const [form, setForm] = useState<SessionForm>(() => initialSessionForm(exam))
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' })
  const [suggested, setSuggested] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [inProgress, setInProgress] = useState<string>()
  const [failure, setFailure] = useState<string[]>([])
  const change = (changes: Partial<SessionForm>) => setForm((f) => ({ ...f, ...changes }))

  // The preview depends on the selection only (never on the minutes), so its key is the preview config.
  const previewKey = useMemo(() => JSON.stringify(buildPreviewConfig(form)), [form])
  useEffect(() => {
    const config = JSON.parse(previewKey) as SessionConfig | null
    if (!config) {
      setPreview({ status: 'idle' })
      return
    }
    setPreview({ status: 'loading' })
    let current = true
    const timer = setTimeout(() => {
      examsService.previewSession(exam.id, config).then(
        (data) => {
          if (!current) return
          setPreview({ status: 'ok', data })
          setSuggested(data.suggestedMinutes)
          setForm((f) => withSuggestedMinutes(f, data.suggestedMinutes))
        },
        (e: unknown) => current && setPreview({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) })
      )
    }, PREVIEW_DEBOUNCE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, examsService, exam.id])

  const config = buildSessionConfig(form)
  const canStart = preview.status === 'ok' && preview.data.shortages.length === 0 && preview.data.drawCount > 0 && config !== null && !starting

  async function start() {
    if (!config) return
    setStarting(true)
    setInProgress(undefined)
    setFailure([])
    try {
      const attempt = await examsService.startAttempt(exam.id, config)
      navigate(`/studies/attempts/${attempt.id}`)
    } catch (e) {
      if (e instanceof ExamsAttemptInProgressError) setInProgress(e.attemptId)
      else if (e instanceof ExamsValidationError) setFailure(e.details.map((d) => d.message))
      else setFailure([e instanceof Error ? e.message : String(e)])
      setStarting(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link to={`/studies/exams/${exam.id}`} className="text-sm text-neutral-400 hover:text-neutral-100">{exam.name}</Link>
        <Text variant="h1" color="default">Nuevo simulacro</Text>
      </header>

      <div role="radiogroup" aria-label="Tipo de simulacro" className="flex flex-wrap gap-3">
        <div className="min-w-[16rem] flex-1 rounded-lg border border-surface-border bg-surface-raised p-4">
          <ChoiceInput type="radio" name="mode" checked={form.mode === 'simulation'} onChange={() => change({ mode: 'simulation' })}>
            <span className="font-semibold">Simulacro real</span>
            <span className="text-neutral-400">{`${exam.questionCount} preguntas · ${exam.timeLimitMin} min · respuestas al final`}</span>
          </ChoiceInput>
        </div>
        <div className="min-w-[16rem] flex-1 rounded-lg border border-surface-border bg-surface-raised p-4">
          <ChoiceInput type="radio" name="mode" checked={form.mode === 'custom'} onChange={() => change({ mode: 'custom' })}>
            <span className="font-semibold">Personalizado</span>
          </ChoiceInput>
        </div>
      </div>

      {form.mode === 'custom' && (
        <div className="flex flex-col gap-5 rounded-lg border border-surface-border p-4">
          <SelectionFields exam={exam} form={form} sets={sets} onChange={change} />
          <TimingFields
            form={form}
            suggestedMinutes={suggested}
            onTiming={(timing) => change({ timing })}
            onMinutes={(value) => setForm((f) => editMinutes(f, value))}
            onReset={() => setForm((f) => resetMinutes(f, suggested ?? 0))}
          />
          <FeedbackFields value={form.feedback} onChange={(feedback) => change({ feedback })} />
        </div>
      )}

      <PreviewSummary preview={preview} />

      {inProgress !== undefined && <AttemptInProgressNotice attemptId={inProgress} />}
      {failure.length > 0 && (
        <Alert variant="error" title="No se pudo empezar">
          {failure.join('; ')}
        </Alert>
      )}

      <div>
        <Button onClick={start} disabled={!canStart} loading={starting}>Empezar</Button>
      </div>
    </div>
  )
}
