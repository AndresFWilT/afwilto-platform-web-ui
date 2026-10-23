import { useCallback, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Alert, EmptyState, Text } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import type { ReviewFilter } from '@/exams/domain'
import { ExamsAttemptInProgressError, ExamsNotFoundError } from '@/exams/application/ports'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { BreakdownBars } from '../organisms/BreakdownBars'
import { ReviewList } from '../organisms/ReviewList'
import { ScoreSummary } from '../organisms/ScoreSummary'

export function ResultPage() {
  const { attemptId = '' } = useParams()
  const { examsService } = useServices()
  const location = useLocation()
  // The runner passes how many answers never reached the server when it submitted anyway.
  const unsavedAnswers = Number((location.state as { unsavedAnswers?: number } | null)?.unsavedAnswers ?? 0)
  const [filter, setFilter] = useState<ReviewFilter>('incorrect')
  const resolveMediaUrl = useCallback((sha: string) => examsService.mediaUrl(sha), [examsService])
  const loaded = useAsync(async () => {
    const report = await examsService.getAttemptReport(attemptId)
    const exam = await examsService.getExam(report.examId).catch(() => null)
    return { report, examName: exam?.name }
  }, [examsService, attemptId])

  if (loaded.status === 'loading') return <LoadingRows />
  if (loaded.status === 'error') {
    if (loaded.error instanceof ExamsNotFoundError) {
      return <EmptyState icon="🔎" title="Resultado no encontrado" description="Puede que el simulacro se haya eliminado." />
    }
    if (loaded.error instanceof ExamsAttemptInProgressError) {
      return (
        <div className="flex flex-col items-start gap-3">
          <Text variant="h2" color="default">Este simulacro sigue en curso</Text>
          <ButtonLink to={`/studies/attempts/${attemptId}`}>Continuar</ButtonLink>
        </div>
      )
    }
    return <LoadError error={loaded.error} title="No se pudo cargar el resultado" />
  }
  const { report, examName } = loaded.data
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        {examName && <Text variant="small" color="muted">{examName}</Text>}
        <Text variant="h1" color="default">Resultado</Text>
      </header>
      {unsavedAnswers > 0 && (
        <Alert variant="warning">{unsavedAnswers === 1 ? '1 respuesta no se pudo guardar' : `${unsavedAnswers} respuestas no se pudieron guardar`}</Alert>
      )}
      <ScoreSummary result={report.result} />
      <BreakdownBars breakdown={report.result.breakdown} />
      <ReviewList review={report.review} filter={filter} onFilter={setFilter} resolveMediaUrl={resolveMediaUrl} />
      <div>
        <ButtonLink to={`/studies/exams/${report.examId}`} variant="ghost">Volver al examen</ButtonLink>
      </div>
    </div>
  )
}
