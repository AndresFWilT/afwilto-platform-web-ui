import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import { ManageExamTemplate } from '../templates/ManageExamTemplate'

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
      <EmptyState icon="🔎" title="Exam not found" description="It may have been deleted." />
    ) : (
      <LoadError error={exam.error} title="Could not load the exam" />
    )
  }
  return (
    <Overview exam={exam.data} unclassified={unclassified.status === 'success' ? unclassified.data : 0}>
      {history.status === 'loading' && <LoadingRows />}
      {history.status === 'error' && <LoadError error={history.error} title="Could not load the history" />}
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
    <ManageExamTemplate
      back={{ to: `/studies/subjects/${exam.subjectId}/exams`, label: 'Practice Exams' }}
      title={exam.name}
      meta={
        <>
          <Text variant="body" color="muted">
            {exam.questionCount} questions · {exam.timeLimitMin} min · pass at {exam.passPercent}%
          </Text>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
            <span>{countLabel(exam.questionTotal, 'question', 'questions')} in the bank</span>
            {unclassified > 0 && <span className="text-amber-300">{unclassified} unclassified</span>}
          </div>
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink to={`${base}/start`}>New practice exam</ButtonLink>
          <ButtonLink to={`${base}/import`} variant="ghost">Import</ButtonLink>
          <ButtonLink to={`${base}/questions`} variant="ghost">Question bank</ButtonLink>
          <ButtonLink to={`${base}/edit`} variant="ghost">Edit</ButtonLink>
          <a
            href={examsService.exportUrl(exam.id)}
            download={`${exam.name}.json`}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-brand-800 hover:text-neutral-100"
          >
            Export
          </a>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(true)}>Delete</Button>
        </div>
      }
    >
      {exam.classifications.length === 0 ? (
        <Text variant="body" color="muted">No classifications yet. Import questions to infer them.</Text>
      ) : (
        exam.classifications.map((c) => <ClassificationSection key={c.id} classification={c} exam={exam} />)
      )}

      {children}

      {deleting && (
        <ConfirmDialog
          danger
          title={`Delete the exam “${exam.name}”?`}
          confirmLabel="Delete exam"
          onClose={() => setDeleting(false)}
          describeError={(e) =>
            e instanceof ExamsConflictError && e.rule === 'in_use'
              ? 'Cannot delete: the exam still has questions. Delete them first.'
              : e instanceof Error
                ? e.message
                : String(e)
          }
          onConfirm={async () => {
            await examsService.deleteExam(exam.id)
            showToast('Exam deleted', 'success')
            navigate(`/studies/subjects/${exam.subjectId}/exams`)
          }}
        >
          <p className="text-sm text-neutral-300">This cannot be undone from the app.</p>
        </ConfirmDialog>
      )}
    </ManageExamTemplate>
  )
}
