import type { CellMultiplier, ScrabbleTile } from './types'
import { BoardCell } from './BoardCell'

interface PendingPlacement {
  row: number
  col: number
  tile: ScrabbleTile
}

interface Props {
  board: (string | null)[][]
  multipliers: (CellMultiplier)[][]
  pending: PendingPlacement[]
  onCellClick: (row: number, col: number) => void
}

export function ScrabbleBoard({ board, multipliers, pending, onCellClick }: Props) {
  const pendingMap = new Map<string, ScrabbleTile>()
  pending.forEach(p => pendingMap.set(`${p.row},${p.col}`, p.tile))

  return (
    <div className="w-full overflow-auto" style={{ scrollbarWidth: 'thin' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          minWidth: '360px',
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '1',
          border: '3px solid #5D3A1A',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => (
            <BoardCell
              key={`${row}-${col}`}
              row={row}
              col={col}
              tile={board[row][col]}
              pending={pendingMap.get(`${row},${col}`) ?? null}
              multiplier={multipliers[row][col]}
              onClick={() => onCellClick(row, col)}
            />
          ))
        )}
      </div>
    </div>
  )
}
