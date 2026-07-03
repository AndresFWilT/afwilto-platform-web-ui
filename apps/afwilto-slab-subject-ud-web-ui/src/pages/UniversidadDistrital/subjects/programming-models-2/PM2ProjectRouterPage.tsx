import { useParams } from 'react-router-dom'
import { SubjectPage } from '@/pages/Subject'
import { ChessPage } from './chess/ChessPage'

export function PM2ProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()

  if (projectSlug === 'chess') {
    return (
      <SubjectPage university="distrital" slug="programming-models-2">
        <ChessPage />
      </SubjectPage>
    )
  }

  return <SubjectPage university="distrital" slug="programming-models-2" />
}
