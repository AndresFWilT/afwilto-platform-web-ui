import type { PM2Project } from './data'

interface ArtworkProps {
  project: PM2Project
  className?: string
}

export function ProjectArtwork({ project, className = '' }: ArtworkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {project.slug === 'chess' && <ChessArtwork from={project.gradientFrom} to={project.gradientTo} />}
    </div>
  )
}

function ChessArtwork({ from, to }: { from: string; to: string }) {
  const id = 'pm2-chess-grad'
  const lightSq = 'rgba(240,217,181,0.85)'
  const darkSq  = 'rgba(181,136,99,0.85)'

  const board = [
    ['bR','bN','bB','bQ','bK','bB','bN','bR'],
    ['bP','bP','bP','bP','bP','bP','bP','bP'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,'wP',null,null,null],
    [null,null,null,null,null,null,null,null],
    ['wP','wP','wP','wP',null,'wP','wP','wP'],
    ['wR','wN','wB','wQ','wK','wB','wN','wR'],
  ]

  const squareSize = 16
  const boardSize = 128
  const offsetX = 36
  const offsetY = 4

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />

      {/* Board border */}
      <rect x={offsetX - 2} y={offsetY - 2} width={boardSize + 4} height={boardSize + 4}
        fill="rgba(101,67,33,0.9)" rx="2" />

      {/* Squares */}
      {board.map((row, r) =>
        row.map((piece, c) => {
          const isLight = (r + c) % 2 === 0
          const x = offsetX + c * squareSize
          const y = offsetY + r * squareSize
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={squareSize} height={squareSize}
                fill={isLight ? lightSq : darkSq} />
              {piece && <PieceSvg code={piece} x={x + squareSize / 2} y={y + squareSize / 2} size={10} />}
            </g>
          )
        })
      )}

      {/* Label */}
      <text x="168" y="65" textAnchor="middle" fill="rgba(255,255,255,0.6)"
        fontSize="8" fontFamily="monospace" fontWeight="bold">Chess</text>
      <text x="168" y="76" textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize="6" fontFamily="monospace">Hexagonal</text>
      <text x="168" y="85" textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize="6" fontFamily="monospace">Architecture</text>
    </svg>
  )
}

function PieceSvg({ code, x, y, size }: { code: string; x: number; y: number; size: number }) {
  const isWhite = code[0] === 'w'
  const fill = isWhite ? 'rgba(255,255,255,0.95)' : 'rgba(20,20,20,0.9)'
  const stroke = isWhite ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)'
  const label = code[1]
  return (
    <g>
      <circle cx={x} cy={y} r={size / 2 - 0.5} fill={fill} stroke={stroke} strokeWidth="0.8" />
      <text x={x} y={y + 2.5} textAnchor="middle" fill={isWhite ? '#333' : '#eee'}
        fontSize="5.5" fontFamily="monospace" fontWeight="bold">{label}</text>
    </g>
  )
}
