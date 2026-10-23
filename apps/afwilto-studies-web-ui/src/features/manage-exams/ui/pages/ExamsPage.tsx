import { Link, useParams } from 'react-router-dom'
import { EmptyState, Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import type { ExamSummary } from '@/exams/domain'
import { countLabel, formatPercent } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'

function lastSimulationText(exam: ExamSummary): string {
  const last = exam.lastSimulation
  return last ? `Último simulacro: ${formatPercent(last.scorePercent)} · ${last.passed ? 'Aprobado' : 'No aprobado'}` : 'Sin simulacros todavía'
}

export function ExamsPage() {
  const { subjectId = '' } = useParams()
  const { examsService } = useServices()
  const exams = useAsync(() => examsService.listExams(subjectId), [examsService, subjectId])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link to={`/studies/subjects/${subjectId}`} className="text-sm text-neutral-400 hover:text-neutral-100">
            Volver a la materia
          </Link>
          <Text variant="h1" color="default">Simulacros</Text>
        </div>
        <ButtonLink to={`/studies/subjects/${subjectId}/exams/new`}>Nuevo examen</ButtonLink>
      </header>

      {exams.status === 'loading' && <LoadingRows />}
      {exams.status === 'error' && <LoadError error={exams.error} title="No se pudieron cargar los exámenes" />}
      {exams.status === 'success' &&
        (exams.data.length === 0 ? (
          <EmptyState icon="📝" title="Esta materia aún no tiene exámenes" description="Crea uno para importar preguntas y hacer simulacros." />
        ) : (
          <ul aria-label="Exámenes" className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
            {exams.data.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <Link to={`/studies/exams/${exam.id}`} className="font-medium text-neutral-100 hover:text-primary-300">
                    {exam.name}
                  </Link>
                  <span className="text-xs text-neutral-500">
                    {countLabel(exam.questionCount, 'pregunta', 'preguntas')} · {exam.timeLimitMin} min · aprobado con {exam.passPercent} %
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-sm">
                  <span className="text-neutral-200">{countLabel(exam.questionTotal, 'pregunta', 'preguntas')}</span>
                  <span className="text-xs text-neutral-400">{lastSimulationText(exam)}</span>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  )
}
