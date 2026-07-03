import type { PieceColor, PromotionPiece } from './types'
import { ChessPiece } from './ChessPiece'
import { Text } from '@afwilto/design-system'

interface Props {
  color: PieceColor
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
}

const OPTIONS: { piece: PromotionPiece; label: string }[] = [
  { piece: 'Q', label: 'Queen' },
  { piece: 'R', label: 'Rook' },
  { piece: 'B', label: 'Bishop' },
  { piece: 'N', label: 'Knight' },
]

export function PromotionDialog({ color, onSelect, onCancel }: Props) {
  const prefix = color === 'WHITE' ? 'w' : 'b'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-overlay border border-surface-border rounded-2xl p-6 flex flex-col gap-4 shadow-2xl min-w-64">
        <Text variant="h4" color="default">Pawn Promotion</Text>
        <Text variant="caption" color="muted">Choose the piece to promote to:</Text>
        <div className="grid grid-cols-4 gap-3">
          {OPTIONS.map(({ piece, label }) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-surface-border hover:border-primary-500 hover:bg-surface-raised transition-all"
            >
              <ChessPiece code={`${prefix}${piece}` as any} size={40} />
              <Text variant="caption" color="muted">{label}</Text>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="text-neutral-400 hover:text-neutral-200 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
