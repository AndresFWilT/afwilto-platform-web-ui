import { Text, Badge } from '@afwilto/design-system'
import type { TTTGameStatus, TTTMark } from './types'

interface Props {
  status: TTTGameStatus
  currentMark: TTTMark
  humanMark: TTTMark | null
  isComputerThinking: boolean
  moveCount: number
  onReset: () => void
}

export function GameStatusDisplay({ status, currentMark, humanMark, isComputerThinking, moveCount, onReset }: Props) {
  const isOver = status !== 'IN_PROGRESS'

  const statusLabel = () => {
    if (isComputerThinking) return 'Computer is thinking…'
    if (status === 'X_WINS') return 'X Wins!'
    if (status === 'O_WINS') return 'O Wins!'
    if (status === 'DRAW') return "It's a Draw!"
    const isHumanTurn = humanMark === null || currentMark === humanMark
    return isHumanTurn ? `${currentMark}'s turn` : "Computer's turn"
  }

  const badgeVariant = () => {
    if (status === 'DRAW') return 'neutral' as const
    if (isOver) return 'success' as const
    return 'primary' as const
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant()} size="md">{statusLabel()}</Badge>
        <Text variant="caption" color="muted">Move {moveCount}</Text>
      </div>

      {isOver && (
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
        >
          Play Again
        </button>
      )}
    </div>
  )
}
