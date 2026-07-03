import { Text, Badge } from '@afwilto/design-system'
import type { GameStatus, PieceCode, PieceColor, Players } from './types'
import { ChessPiece } from './ChessPiece'

interface Props {
  activeColor: PieceColor
  players: Players
  status: GameStatus
  captured: PieceCode[]
  fullmoveNumber: number
  isFlipped: boolean
  onFlip: () => void
}

export function GameInfoPanel({ activeColor, players, status, captured, fullmoveNumber, isFlipped, onFlip }: Props) {
  const whiteCaptured = captured.filter(p => p[0] === 'b')
  const blackCaptured = captured.filter(p => p[0] === 'w')

  const statusLabel: Record<GameStatus, string> = {
    IN_PROGRESS: 'In Progress',
    CHECK: 'Check!',
    CHECKMATE: 'Checkmate',
    STALEMATE: 'Stalemate',
    DRAW: 'Draw',
  }

  const statusVariant: Record<GameStatus, 'neutral' | 'warning' | 'error' | 'success' | 'primary'> = {
    IN_PROGRESS: 'neutral',
    CHECK: 'warning',
    CHECKMATE: 'error',
    STALEMATE: 'primary',
    DRAW: 'primary',
  }

  const isOver = status === 'CHECKMATE' || status === 'STALEMATE' || status === 'DRAW'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Badge variant={statusVariant[status]} size="md">{statusLabel[status]}</Badge>
        <Text variant="caption" color="muted">Move {fullmoveNumber}</Text>
      </div>

      {/* Active player */}
      {!isOver && (
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-3 py-2 border border-surface-border">
          <div className="w-3 h-3 rounded-full border border-neutral-400"
            style={{ backgroundColor: activeColor === 'WHITE' ? '#f0d9b5' : '#202020' }} />
          <Text variant="small" color="default" weight="semibold">
            {activeColor === 'WHITE' ? players.white : players.black}'s turn
          </Text>
        </div>
      )}
      {isOver && (
        <div className="rounded-lg px-3 py-2 border border-error-500/40 bg-error-500/10 text-center">
          <Text variant="small" color="default" weight="semibold">
            {status === 'CHECKMATE'
              ? `${activeColor === 'WHITE' ? players.black : players.white} wins!`
              : 'Draw'}
          </Text>
        </div>
      )}

      {/* Players */}
      <div className="flex flex-col gap-2">
        {(['WHITE', 'BLACK'] as PieceColor[]).map(color => {
          const name = color === 'WHITE' ? players.white : players.black
          const caps = color === 'WHITE' ? whiteCaptured : blackCaptured
          return (
            <div key={color} className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full mt-0.5 shrink-0 border border-neutral-500"
                style={{ backgroundColor: color === 'WHITE' ? '#f0d9b5' : '#202020' }} />
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <Text variant="caption" color={activeColor === color && !isOver ? 'default' : 'muted'} weight={activeColor === color && !isOver ? 'semibold' : 'normal'}>
                  {name}
                </Text>
                {caps.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {caps.map((p, i) => (
                      <span key={i} className="inline-flex" style={{ width: 14, height: 14 }}>
                        <ChessPiece code={p} size={14} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Flip button */}
      <button
        onClick={onFlip}
        className="mt-auto w-full py-2 rounded-lg border border-surface-border text-neutral-400 hover:text-neutral-100 hover:border-primary-500/60 transition-colors text-sm"
      >
        {isFlipped ? '↑ Flip Board' : '↓ Flip Board'}
      </button>
    </div>
  )
}
