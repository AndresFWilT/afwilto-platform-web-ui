import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, Text, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import type { Difficulty, Exam, QuestionFilter } from '@/exams/domain'
import { ExamsNotFoundError } from '@/exams/application/ports'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'
import { BankFilters, type BankFilterValues } from '../organisms/BankFilters'
import { QuestionDetail } from '../organisms/QuestionDetail'
import { QuestionList } from '../organisms/QuestionList'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function QuestionBankPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Examen no encontrado" description="Puede que se haya eliminado." />
    ) : (
      <LoadError error={exam.error} title="No se pudo cargar el examen" />
    )
  }
  return <Bank exam={exam.data} />
}

function Bank({ exam }: { exam: Exam }) {
  const { examsService } = useServices()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const [revision, setRevision] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const resolveMediaUrl = useCallback((sha: string) => examsService.mediaUrl(sha), [examsService])

  const difficulty = params.get('difficulty')
  const values: BankFilterValues = {
    category: params.get('category') ?? '',
    origin: params.get('origin') ?? '',
    difficulty: DIFFICULTIES.includes(difficulty as Difficulty) ? (difficulty as string) : '',
    q: params.get('q') ?? '',
    unclassified: params.get('unclassified') === 'true',
  }
  const filter: QuestionFilter = {
    ...(values.category && { category: values.category }),
    ...(values.origin && { origin: values.origin }),
    ...(values.difficulty && { difficulty: values.difficulty as Difficulty }),
    ...(values.q && { q: values.q }),
    ...(values.unclassified && { unclassified: true }),
  }
  const active = Object.keys(filter).length > 0

  // The unfiltered bank gives the total and the origin sets; declared first so the filtered call is the latest.
  const everything = useAsync(() => examsService.listQuestions(exam.id), [examsService, exam.id, revision])
  const list = useAsync(() => examsService.listQuestions(exam.id, filter), [examsService, exam.id, revision, params.toString()])
  const open = useAsync(() => (openId ? examsService.getQuestion(openId) : Promise.resolve(null)), [examsService, openId])

  function change(field: keyof BankFilterValues, value: string | boolean) {
    const next = new URLSearchParams(params)
    if (value === '' || value === false) next.delete(field)
    else next.set(field, value === true ? 'true' : value)
    setParams(next, { replace: true })
  }

  const originSets = everything.status === 'success' ? [...new Set(everything.data.flatMap((q) => (q.origin?.set ? [q.origin.set] : [])))].sort() : []

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <Link to={`/studies/exams/${exam.id}`} className="text-sm text-neutral-400 hover:text-neutral-100">{exam.name}</Link>
        <Text variant="h1" color="default">Banco de preguntas</Text>
      </header>

      {everything.status === 'success' && everything.data.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Este examen aún no tiene preguntas"
          description="Impórtalas desde un archivo .json o .zip."
          action={<ButtonLink to={`/studies/exams/${exam.id}/import`}>Importar preguntas</ButtonLink>}
        />
      ) : (
        <>
          <BankFilters classifications={exam.classifications} originSets={originSets} values={values} onChange={change} onClear={() => setParams({}, { replace: true })} active={active} />
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex basis-[24rem] grow flex-col gap-2">
              {list.status === 'loading' && <LoadingRows />}
              {list.status === 'error' && <LoadError error={list.error} title="No se pudo cargar el banco" />}
              {list.status === 'success' && (
                <>
                  <Text variant="small" color="muted">
                    {list.data.length} de {everything.status === 'success' ? everything.data.length : list.data.length} preguntas
                  </Text>
                  {list.data.length === 0 ? (
                    <EmptyState icon="🔎" title="No hay preguntas con estos filtros" />
                  ) : (
                    <QuestionList questions={list.data} openId={openId} onOpen={setOpenId} />
                  )}
                </>
              )}
            </div>
            {openId && (
              <section aria-label="Pregunta seleccionada" className="flex basis-[28rem] grow flex-col gap-3 rounded-lg border border-surface-border p-4">
                {open.status === 'loading' && <LoadingRows />}
                {open.status === 'error' && <LoadError error={open.error} title="No se pudo cargar la pregunta" />}
                {open.status === 'success' && open.data && (
                  <QuestionDetail question={open.data} resolveMediaUrl={resolveMediaUrl} onDelete={() => setDeleting(true)} onClose={() => setOpenId(null)} />
                )}
              </section>
            )}
          </div>
        </>
      )}

      {deleting && open.status === 'success' && open.data && (
        <ConfirmDialog
          danger
          title={`¿Eliminar la pregunta «${open.data.key}»?`}
          confirmLabel="Eliminar pregunta"
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await examsService.deleteQuestion(open.data!.id)
            showToast('Pregunta eliminada', 'success')
            setDeleting(false)
            setOpenId(null)
            setRevision((n) => n + 1)
          }}
        >
          <p className="text-sm text-neutral-300">Se elimina del banco; los intentos pasados conservan su copia.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
