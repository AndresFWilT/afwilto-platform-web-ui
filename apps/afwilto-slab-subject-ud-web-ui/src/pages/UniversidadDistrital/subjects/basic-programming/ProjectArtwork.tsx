import type { BPProject } from './data'

interface ArtworkProps {
  project: BPProject
  className?: string
}

export function ProjectArtwork({ project, className = '' }: ArtworkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {project.slug === 'tic-tac-toe' && <TicTacToeArtwork from={project.gradientFrom} to={project.gradientTo} />}
    </div>
  )
}

function TicTacToeArtwork({ from, to }: { from: string; to: string }) {
  const id = 'bp-ttt-grad'
  const cells: ('X' | 'O' | null)[] = ['O', null, 'X', null, 'X', null, 'O', null, 'O']
  const sq = 38; const gap = 4; const offset = 31

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />

      {/* 3×3 grid lines */}
      {[1, 2].map(i => (
        <g key={i}>
          <line x1={offset + i * (sq + gap) - gap / 2} y1={offset} x2={offset + i * (sq + gap) - gap / 2} y2={offset + 3 * sq + 2 * gap}
            stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <line x1={offset} y1={offset + i * (sq + gap) - gap / 2} x2={offset + 3 * sq + 2 * gap} y2={offset + i * (sq + gap) - gap / 2}
            stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
        </g>
      ))}

      {/* Cells */}
      {cells.map((mark, i) => {
        const r = Math.floor(i / 3); const c = i % 3
        const x = offset + c * (sq + gap); const y = offset + r * (sq + gap)
        const cx = x + sq / 2; const cy = y + sq / 2

        return (
          <g key={i}>
            <rect x={x} y={y} width={sq} height={sq} fill="rgba(255,255,255,0.06)" rx="4" />
            {mark === 'X' && (
              <>
                <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" />
                <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" />
              </>
            )}
            {mark === 'O' && (
              <circle cx={cx} cy={cy} r={11} fill="none" stroke="#60a5fa" strokeWidth="3.5" />
            )}
          </g>
        )
      })}

      {/* Win line for X diagonal */}
      <line x1={offset + 0.5 * sq} y1={offset + 0.5 * sq}
        x2={offset + 2.5 * sq + 2 * gap} y2={offset + 2.5 * sq + 2 * gap}
        stroke="rgba(248,113,113,0.6)" strokeWidth="3" strokeLinecap="round" />

      <text x="162" y="55" textAnchor="middle" fill="rgba(255,255,255,0.6)"
        fontSize="8" fontFamily="monospace" fontWeight="bold">Minimax</text>
      <text x="162" y="66" textAnchor="middle" fill="rgba(255,255,255,0.35)"
        fontSize="6" fontFamily="monospace">α-β pruning</text>
    </svg>
  )
}
