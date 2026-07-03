import type { CS3Project } from './data'

interface ArtworkProps {
  project: CS3Project
  className?: string
}

export function ProjectArtwork({ project, className = 'h-36 w-full' }: ArtworkProps) {
  const Component = ARTWORK[project.slug] ?? DefaultArtwork
  return (
    <div className={`relative overflow-hidden rounded-t-lg ${className}`}>
      <Component from={project.gradientFrom} to={project.gradientTo} />
    </div>
  )
}

interface SvgProps { from: string; to: string }

const G = ({ id, from, to }: { id: string; from: string; to: string }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  </defs>
)

// ── Critical Path ──────────────────────────────────────────────────────────────
function CriticalPath({ from, to }: SvgProps) {
  const id = 'cpg'
  const nodes = [
    { cx: 30, cy: 60, label: 'A' },
    { cx: 80, cy: 30, label: 'B' },
    { cx: 80, cy: 90, label: 'C' },
    { cx: 130, cy: 60, label: 'D' },
    { cx: 170, cy: 60, label: 'E' },
  ]
  const edges = [
    { from: 0, to: 1, crit: false },
    { from: 0, to: 2, crit: true  },
    { from: 1, to: 3, crit: false },
    { from: 2, to: 3, crit: true  },
    { from: 3, to: 4, crit: true  },
  ]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {edges.map((e, i) => {
        const n1 = nodes[e.from], n2 = nodes[e.to]
        return (
          <line key={i} x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy}
            stroke={e.crit ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.25)'}
            strokeWidth={e.crit ? 2.5 : 1.5} />
        )
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={12}
            fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <text x={n.cx} y={n.cy + 4} fill="white" fontSize="9" fontFamily="monospace"
            fontWeight="700" textAnchor="middle">{n.label}</text>
        </g>
      ))}
      {/* ES/EF labels on critical path */}
      <text x={152} y={48} fill="rgba(248,113,113,0.9)" fontSize="7" fontFamily="monospace">ES:12</text>
      <text x={152} y={73} fill="rgba(248,113,113,0.9)" fontSize="7" fontFamily="monospace">EF:19</text>
    </svg>
  )
}

// ── Truth Table ────────────────────────────────────────────────────────────────
function TruthTable({ from, to }: SvgProps) {
  const id = 'ttg'
  const rows = [
    { p: 'T', q: 'T', r: 'T', res: 'T', crit: true  },
    { p: 'T', q: 'T', r: 'F', res: 'F', crit: false },
    { p: 'T', q: 'F', r: 'T', res: 'T', crit: true  },
    { p: 'T', q: 'F', r: 'F', res: 'T', crit: true  },
    { p: 'F', q: 'T', r: 'T', res: 'T', crit: true  },
  ]
  const colX = [22, 50, 78, 148]
  const rowH = 17
  const startY = 18
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* Header */}
      {['p','q','r','result'].map((h, i) => (
        <text key={h} x={colX[i]} y={12} fill="rgba(255,255,255,0.7)" fontSize="8"
          fontFamily="monospace" fontWeight="700" textAnchor="middle">{h}</text>
      ))}
      <line x1={8} y1={15} x2={192} y2={15} stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
      {rows.map((row, i) => {
        const y = startY + i * rowH
        return (
          <g key={i}>
            {row.res === 'T' && (
              <rect x={125} y={y - 8} width={50} height={rowH - 2} rx="2"
                fill="rgba(52,211,153,0.15)" />
            )}
            {row.res === 'F' && (
              <rect x={125} y={y - 8} width={50} height={rowH - 2} rx="2"
                fill="rgba(248,113,113,0.15)" />
            )}
            {([['p', row.p], ['q', row.q], ['r', row.r]] as [string, string][]).map(([k, v], ci) => (
              <text key={k} x={colX[ci]} y={y} fill="rgba(255,255,255,0.8)"
                fontSize="8" fontFamily="monospace" textAnchor="middle">
                {v}
              </text>
            ))}
            <text x={colX[3]} y={y}
              fill={row.res === 'T' ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)'}
              fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
              {row.res}
            </text>
          </g>
        )
      })}
      {/* Formula label */}
      <text x={196} y={112} fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace"
        fontStyle="italic" textAnchor="end">(p∧q)⇒r</text>
    </svg>
  )
}

// ── Default fallback ──────────────────────────────────────────────────────────
function DefaultArtwork({ from, to }: SvgProps) {
  const id = 'cs3dfg'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <G id={id} from={from} to={to} />
      <rect width="200" height="120" fill={`url(#${id})`} />
    </svg>
  )
}

const ARTWORK: Record<string, React.FC<SvgProps>> = {
  'critical-path': CriticalPath,
  'truth-table':   TruthTable,
}
