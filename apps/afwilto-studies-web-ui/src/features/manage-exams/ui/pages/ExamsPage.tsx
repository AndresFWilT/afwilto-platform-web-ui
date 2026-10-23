import { useParams } from 'react-router-dom'
import { EmptyState } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { ExamList } from '../organisms/ExamList'
import { ManageExamTemplate } from '../templates/ManageExamTemplate'

export function ExamsPage() {
  const { subjectId = '' } = useParams()
  const { examsService } = useServices()
  const exams = useAsync(() => examsService.listExams(subjectId), [examsService, subjectId])

  return (
    <ManageExamTemplate
      back={{ to: `/studies/subjects/${subjectId}`, label: 'Volver a la materia' }}
      title="Simulacros"
      actions={<ButtonLink to={`/studies/subjects/${subjectId}/exams/new`}>Nuevo examen</ButtonLink>}
    >
      {exams.status === 'loading' && <LoadingRows />}
      {exams.status === 'error' && <LoadError error={exams.error} title="No se pudieron cargar los exámenes" />}
      {exams.status === 'success' &&
        (exams.data.length === 0 ? (
          <EmptyState icon="📝" title="Esta materia aún no tiene exámenes" description="Crea uno para importar preguntas y hacer simulacros." />
        ) : (
          <ExamList exams={exams.data} />
        ))}
    </ManageExamTemplate>
  )
}
