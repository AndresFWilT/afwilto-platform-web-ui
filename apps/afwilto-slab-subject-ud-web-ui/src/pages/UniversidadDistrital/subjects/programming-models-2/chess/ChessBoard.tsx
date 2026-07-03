import type { ChessMove, GameState, GameStatus, PieceCode, Square } from './types'
import { ChessSquare } from './ChessSquare'

interface Props {
  state: GameState
  status: GameStatus
  selectedSquare: Square | null
  legalMoves: ChessMove[]
  lastMove: ChessMove | null
  isFlipped: boolean
  onSquareClick: (sq: Square) => void
}

export function ChessBoard({ state, status, selectedSquare, legalMoves, lastMove, isFlipped, onSquareClick }: Props) {
  const legalTargets = new Set(legalMoves.map(m => `${m.to.row},${m.to.col}`))
  const lastMoveSquares = lastMove
    ? new Set([`${lastMove.from.row},${lastMove.from.col}`, `${lastMove.to.row},${lastMove.to.col}`])
    : new Set<string>()

  const isCheck = status === 'CHECK' || status === 'CHECKMATE'
  const kingInCheckSquare = isCheck ? findActiveKing(state) : null

  const rows = [0,1,2,3,4,5,6,7]
  const displayRows = isFlipped ? rows : [...rows].reverse()
  const cols = isFlipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7]

  return (
    <div
      className="inline-grid shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        width: '100%',
        maxWidth: '560px',
        aspectRatio: '1',
      }}
    >
      {displayRows.flatMap(r =>
        cols.map(c => {
          const piece = state.board[r][c] as PieceCode | null
          const sq = `${r},${c}`
          return (
            <ChessSquare
              key={sq}
              row={r}
              col={c}
              piece={piece}
              isSelected={selectedSquare ? selectedSquare.row === r && selectedSquare.col === c : false}
              isLegalTarget={legalTargets.has(sq)}
              isLastMoveSquare={lastMoveSquares.has(sq)}
              isKingInCheck={kingInCheckSquare === sq}
              onClick={onSquareClick}
            />
          )
        })
      )}
    </div>
  )
}

function findActiveKing(state: GameState): string | null {
  const kingCode: PieceCode = state.activeColor === 'WHITE' ? 'wK' : 'bK'
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (state.board[r][c] === kingCode) return `${r},${c}`
    }
  }
  return null
}
