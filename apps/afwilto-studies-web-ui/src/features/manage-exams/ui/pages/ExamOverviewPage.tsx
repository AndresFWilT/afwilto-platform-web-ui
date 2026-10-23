import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyState, Text, useToast } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import type { Exam } from '@/exams/domain'
import { ExamsConflictError, ExamsNotFoundError } from '@/exams/application/ports'
import { countLabel } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { ConfirmDialog } from '@/shared/ui/organisms/ConfirmDialog'
import { ClassificationSection } from '../organisms/ClassificationSection'
import { ExamHistory } from '../organisms/ExamHistory'

export function ExamOverviewPage() {
  const { examId = '' } = useParams()
  const { examsService } = useServices()
  const exam = useAsync(() => examsService.getExam(examId), [examsService, examId])
  const history = useAsync(() => examsService.listAttempts(examId), [examsService, examId])
  // The server counts the unclassified questions; the overview never derives it from the classifications.
  const unclassified = useAsync(() => examsService.countUnclassified(examId), [examsService, examId])

  if (exam.status === 'loading') return <LoadingRows />
  if (exam.status === 'error') {
    return exam.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Examen no encontrado" description="Puede que se haya eliminado." />
    ) : (
      <LoadError error={exam.error} title="No se pudo cargar el examen" />
    )
  }
  return (
    <Overview exam={exam.data} unclassified={unclassified.status === 'success' ? unclassified.data : 0}>
      {history.status === 'loading' && <LoadingRows />}
      {history.status === 'error' && <LoadError error={history.error} title="No se pudo cargar el historial" />}
      {history.status === 'success' && <ExamHistory history={history.data} />}
    </Overview>
  )
}

function Overview({ exam, unclassified, children }: { exam: Exam; unclassified: number; children: React.ReactNode }) {
  const { examsService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const base = `/studies/exams/${exam.id}`

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link to={`/studies/subjects/${exam.subjectId}/exams`} className="text-sm text-neutral-400 hover:text-neutral-100">
          Simulacros
        </Link>
        <Text variant="h1" color="default">{exam.name}</Text>
        <Text variant="body" color="muted">
          {exam.questionCount} preguntas · {exam.timeLimitMin} min · aprobado con {exam.passPercent} %
        </Text>
        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
          <span>{countLabel(exam.questionTotal, 'pregunta', 'preguntas')} en el banco</span>
          {unclassified > 0 && <span className="text-amber-300">{unclassified} sin clasificar</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <ButtonLink to={`${base}/start`}>Nuevo simulacro</ButtonLink>
          <ButtonLink to={`${base}/import`} variant="ghost">Importar</ButtonLink>
          <ButtonLink to={`${base}/questions`} variant="ghost">Banco</ButtonLink>
          <ButtonLink to={`${base}/edit`} variant="ghost">Editar</ButtonLink>
          <a
            href={examsService.exportUrl(exam.id)}
            download={`${exam.name}.json`}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-brand-800 hover:text-neutral-100"
          >
            Exportar
          </a>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(true)}>Eliminar</Button>
        </div>
      </header>

      {exam.classifications.length === 0 ? (
        <Text variant="body" color="muted">Aún no hay clasificaciones. Importa preguntas para inferirlas.</Text>
      ) : (
        exam.classifications.map((c) => <ClassificationSection key={c.id} classification={c} exam={exam} />)
      )}

      {children}

      {deleting && (
        <ConfirmDialog
          danger
          title={`¿Eliminar el examen «${exam.name}»?`}
          confirmLabel="Eliminar examen"
          onClose={() => setDeleting(false)}
          describeError={(e) =>
            e instanceof ExamsConflictError && e.rule === 'in_use'
              ? 'No se puede eliminar: el examen aún tiene preguntas. Elimínalas primero.'
              : e instanceof Error
                ? e.message
                : String(e)
          }
          onConfirm={async () => {
            await examsService.deleteExam(exam.id)
            showToast('Examen eliminado', 'success')
            navigate(`/studies/subjects/${exam.subjectId}/exams`)
          }}
        >
          <p className="text-sm text-neutral-300">Esta acción no se puede deshacer desde la aplicación.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
