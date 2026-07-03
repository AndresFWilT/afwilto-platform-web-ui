import type { ScrabbleTile } from './types'

interface Props {
  tile: ScrabbleTile
  selected?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

export function TileComponent({ tile, selected = false, onClick, size = 'md' }: Props) {
  const dim = size === 'md' ? 44 : 32
  const fontSize = size === 'md' ? 18 : 13
  const valueFontSize = size === 'md' ? 9 : 7

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none rounded transition-all duration-100 ${
        selected ? 'ring-2 ring-primary-400 scale-110 z-10' : 'hover:scale-105'
      }`}
      style={{
        width: dim, height: dim,
        backgroundColor: '#F5DEB3',
        boxShadow: selected
          ? '0 0 0 2px #60a5fa, 2px 3px 0 #8B7355'
          : '2px 3px 0 #8B7355',
        border: '1px solid #C8A96E',
      }}
    >
      <span style={{ color: '#1a1a1a', fontSize, fontFamily: 'Georgia, serif', fontWeight: 700, lineHeight: 1 }}>
        {tile.letter === 'BLANK' ? ' ' : tile.letter}
      </span>
      <span className="absolute bottom-0.5 right-1"
        style={{ color: '#444', fontSize: valueFontSize, fontFamily: 'Georgia, serif', lineHeight: 1 }}>
        {tile.value}
      </span>
    </div>
  )
}
