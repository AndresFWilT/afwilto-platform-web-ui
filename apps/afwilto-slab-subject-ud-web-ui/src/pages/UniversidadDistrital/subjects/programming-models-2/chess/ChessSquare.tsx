import type { PieceCode, Square } from './types'
import { ChessPiece } from './ChessPiece'

interface Props {
  row: number
  col: number
  piece: PieceCode | null
  isSelected: boolean
  isLegalTarget: boolean
  isLastMoveSquare: boolean
  isKingInCheck: boolean
  onClick: (sq: Square) => void
}

const LIGHT = '#F0D9B5'
const DARK  = '#B58863'

export function ChessSquare({
  row, col, piece, isSelected, isLegalTarget, isLastMoveSquare, isKingInCheck, onClick,
}: Props) {
  const isLight = (row + col) % 2 === 0
  const base = isLight ? LIGHT : DARK

  let overlay = 'transparent'
  if (isKingInCheck)     overlay = 'rgba(200,0,0,0.45)'
  else if (isSelected)   overlay = 'rgba(20,85,30,0.5)'
  else if (isLastMoveSquare) overlay = 'rgba(255,255,0,0.25)'

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ backgroundColor: base, aspectRatio: '1' }}
      onClick={() => onClick({ row, col })}
    >
      {/* Colour overlay (check, selection, last-move) */}
      {overlay !== 'transparent' && (
        <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
      )}

      {/* Legal move indicator */}
      {isLegalTarget && !piece && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="rounded-full" style={{
            width: '30%', height: '30%',
            backgroundColor: 'rgba(20,85,30,0.5)',
          }} />
        </div>
      )}
      {isLegalTarget && piece && (
        <div className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ boxShadow: 'inset 0 0 0 4px rgba(20,85,30,0.6)' }} />
      )}

      {/* Piece */}
      {piece && (
        <div className="relative z-20 w-[82%] h-[82%] flex items-center justify-center">
          <ChessPiece code={piece} size={48} />
        </div>
      )}

      {/* Rank/file labels (a-h, 1-8) on board edges */}
      {col === 0 && (
        <span className="absolute top-0.5 left-0.5 text-[9px] font-bold leading-none pointer-events-none z-30"
          style={{ color: isLight ? DARK : LIGHT }}>
          {8 - row}
        </span>
      )}
      {row === 7 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold leading-none pointer-events-none z-30"
          style={{ color: isLight ? DARK : LIGHT }}>
          {String.fromCharCode(97 + col)}
        </span>
      )}
    </div>
  )
}
