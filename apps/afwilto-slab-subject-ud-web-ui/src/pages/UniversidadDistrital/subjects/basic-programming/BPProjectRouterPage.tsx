import { useParams } from 'react-router-dom'
import { SubjectPage } from '@/pages/Subject'
import { TicTacToePage } from './tictactoe/TicTacToePage'

export function BPProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()

  if (projectSlug === 'tic-tac-toe') {
    return (
      <SubjectPage university="distrital" slug="basic-programming">
        <TicTacToePage />
      </SubjectPage>
    )
  }

  return <SubjectPage university="distrital" slug="basic-programming" />
}
