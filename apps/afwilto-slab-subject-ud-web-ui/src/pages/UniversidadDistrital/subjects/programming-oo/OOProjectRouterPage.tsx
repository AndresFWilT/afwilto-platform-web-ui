import { useParams } from 'react-router-dom'
import { SubjectPage } from '@/pages/Subject'
import { ScrabblePage } from './scrabble/ScrabblePage'

export function OOProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()

  if (projectSlug === 'scrabble') {
    return (
      <SubjectPage university="distrital" slug="object-oriented-programming">
        <ScrabblePage />
      </SubjectPage>
    )
  }

  return <SubjectPage university="distrital" slug="object-oriented-programming" />
}
