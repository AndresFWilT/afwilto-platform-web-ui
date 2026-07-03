import type { CellMultiplier, ScrabbleTile } from './types'
import { TileComponent } from './TileComponent'

interface Props {
  row: number
  col: number
  tile: string | null
  pending: ScrabbleTile | null
  multiplier: CellMultiplier
  onClick: () => void
}

const MULT_COLOR: Record<string, string> = {
  TRIPLE_WORD:   '#CC3333',
  DOUBLE_WORD:   '#E8A0A0',
  TRIPLE_LETTER: '#3366CC',
  DOUBLE_LETTER: '#88CCEE',
  CENTER_STAR:   '#E8A0A0',
}

const MULT_LABEL: Record<string, string> = {
  TRIPLE_WORD:   'TW',
  DOUBLE_WORD:   'DW',
  TRIPLE_LETTER: 'TL',
  DOUBLE_LETTER: 'DL',
  CENTER_STAR:   '★',
}

const TILE_COLOR = '#D2B48C'

export function BoardCell({ tile, pending, multiplier, onClick }: Props) {
  const bg = tile || pending
    ? '#F5DEB3'
    : multiplier
    ? MULT_COLOR[multiplier]
    : TILE_COLOR

  const label = MULT_LABEL[multiplier ?? '']

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none border border-black/10"
      style={{ backgroundColor: bg, aspectRatio: '1', minWidth: 0 }}
    >
      {tile && (
        <span style={{
          color: '#1a1a1a',
          fontSize: 'clamp(8px, 1.8vw, 15px)',
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
        }}>
          {tile === 'BLANK' ? ' ' : tile.replace('_', '')}
        </span>
      )}
      {!tile && pending && (
        <div className="opacity-80">
          <TileComponent tile={pending} size="sm" />
        </div>
      )}
      {!tile && !pending && label && (
        <span style={{
          color: multiplier === 'TRIPLE_WORD' || multiplier === 'TRIPLE_LETTER' ? 'white' : '#333',
          fontSize: 'clamp(5px, 1.2vw, 9px)',
          fontFamily: 'monospace',
          fontWeight: 700,
          textAlign: 'center',
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
