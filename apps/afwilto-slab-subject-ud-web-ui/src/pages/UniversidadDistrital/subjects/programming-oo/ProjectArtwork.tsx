import type { OOProject } from './data'

interface ArtworkProps {
  project: OOProject
  className?: string
}

export function ProjectArtwork({ project, className = '' }: ArtworkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {project.slug === 'scrabble' && <ScrabbleArtwork from={project.gradientFrom} to={project.gradientTo} />}
    </div>
  )
}

function ScrabbleArtwork({ from, to }: { from: string; to: string }) {
  const id = 'oo-scrabble-grad'
  const TL = '#3366CC'
  const NONE = '#D2B48C'; const CENTER = '#E8A0A0'

  // Mini 7×7 center section of the board (rows 4-10, cols 4-10)
  const miniLayout = [
    [NONE, NONE, TL,   NONE, NONE, NONE, TL  ],
    [NONE, NONE, NONE, NONE, NONE, NONE, NONE],
    [TL,   NONE, NONE, NONE, NONE, NONE, NONE],
    [NONE, NONE, NONE, CENTER,NONE,NONE, NONE],
    [NONE, NONE, NONE, NONE, NONE, NONE, TL  ],
    [NONE, NONE, NONE, NONE, NONE, NONE, NONE],
    [TL,   NONE, NONE, NONE, NONE, NONE, NONE],
  ]

  // Sample tiles on the board
  const tiles: { row: number; col: number; letter: string }[] = [
    { row: 3, col: 3, letter: '★' },
    { row: 3, col: 4, letter: 'G' },
    { row: 3, col: 5, letter: 'A' },
    { row: 3, col: 6, letter: 'T' },
    { row: 2, col: 4, letter: 'R' },
    { row: 1, col: 4, letter: 'E' },
    { row: 0, col: 4, letter: 'A' },
  ]

  const sq = 17; const ox = 18; const oy = 6

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
      <rect x={ox - 1} y={oy - 1} width={7 * sq + 2} height={7 * sq + 2} fill="rgba(0,0,0,0.4)" rx="2" />

      {/* Grid cells */}
      {miniLayout.map((row, r) =>
        row.map((color, c) => (
          <rect key={`${r}-${c}`} x={ox + c * sq} y={oy + r * sq}
            width={sq - 0.5} height={sq - 0.5} fill={color} opacity="0.9" />
        ))
      )}

      {/* Tiles */}
      {tiles.map(({ row, col, letter }) => (
        <g key={`${row}-${col}`}>
          <rect x={ox + col * sq + 1} y={oy + row * sq + 1} width={sq - 2.5} height={sq - 2.5}
            fill="#F5DEB3" rx="1.5" />
          <text x={ox + col * sq + sq / 2 - 0.5} y={oy + row * sq + sq / 2 + 4}
            textAnchor="middle" fill="#333" fontSize="8" fontFamily="serif" fontWeight="bold">
            {letter}
          </text>
        </g>
      ))}

      {/* Label */}
      <text x="155" y="55" textAnchor="middle" fill="rgba(255,255,255,0.7)"
        fontSize="8" fontFamily="monospace" fontWeight="bold">Scrabble</text>
      <text x="155" y="66" textAnchor="middle" fill="rgba(255,255,255,0.4)"
        fontSize="6" fontFamily="monospace">Spanish</text>
      <text x="155" y="75" textAnchor="middle" fill="rgba(255,255,255,0.4)"
        fontSize="6" fontFamily="monospace">15×15</text>
    </svg>
  )
}
