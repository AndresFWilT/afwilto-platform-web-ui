import type { TTTMark } from './types'
import { BoardCell } from './BoardCell'

interface Props {
  board: (TTTMark | null)[][]
  currentMark: TTTMark
  onCellClick: (row: number, col: number) => void
  disabled: boolean
}

export function GameBoard({ board, currentMark, onCellClick, disabled }: Props) {
  return (
    <div
      className="grid gap-2 p-3 rounded-2xl shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        width: '300px',
        height: '300px',
        backgroundColor: 'var(--color-brand-100)',
      }}
    >
      {board.flatMap((row, r) =>
        row.map((mark, c) => (
          <BoardCell
            key={`${r}-${c}`}
            mark={mark}
            onClick={() => onCellClick(r, c)}
            disabled={disabled || mark !== null}
            ghostMark={mark === null ? currentMark : null}
          />
        ))
      )}
    </div>
  )
}
