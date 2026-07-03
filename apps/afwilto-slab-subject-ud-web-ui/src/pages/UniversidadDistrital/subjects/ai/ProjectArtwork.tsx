import type { AIProject } from './data'

interface ArtworkProps {
  project: AIProject
  className?: string
}

export function ProjectArtwork({ project, className = '' }: ArtworkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {project.slug === 'a-star' && <AStarArtwork from={project.gradientFrom} to={project.gradientTo} />}
      {project.slug === 'depth-first-search' && <DFSArtwork from={project.gradientFrom} to={project.gradientTo} />}
    </div>
  )
}

function AStarArtwork({ from, to }: { from: string; to: string }) {
  const id = 'ai-astar-grad'
  return (
    <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <marker id="ai-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="rgba(255,255,255,0.4)" />
        </marker>
      </defs>
      <rect width="340" height="120" fill={`url(#${id})`} />

      {/* Nodes */}
      {[
        { cx: 50,  cy: 60,  label: 'A', f: '80', col: 'rgba(99,102,241,0.8)' },
        { cx: 130, cy: 30,  label: 'B', f: '72', col: 'rgba(34,197,94,0.7)' },
        { cx: 130, cy: 90,  label: 'C', f: '93', col: 'rgba(255,255,255,0.15)' },
        { cx: 210, cy: 30,  label: 'D', f: '49', col: 'rgba(34,197,94,0.7)' },
        { cx: 210, cy: 90,  label: 'G', f: '73', col: 'rgba(255,255,255,0.15)' },
        { cx: 290, cy: 60,  label: '★', f: '19', col: 'rgba(245,158,11,0.85)' },
      ].map(n => (
        <g key={n.label}>
          <circle cx={n.cx} cy={n.cy} r={18} fill={n.col} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <text x={n.cx} y={n.cy - 3} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">{n.label}</text>
          <text x={n.cx} y={n.cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="monospace">f={n.f}</text>
        </g>
      ))}

      {/* Edges */}
      {[
        [68, 60, 112, 38], [68, 60, 112, 82],
        [148, 30, 192, 30], [148, 90, 192, 90],
        [228, 30, 275, 52], [228, 90, 275, 68],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#ai-arr)" />
      ))}

      {/* Solution path highlight */}
      <path d="M 50 60 Q 90 40 130 30 Q 170 30 210 30 Q 250 35 290 60"
        fill="none" stroke="rgba(99,102,241,0.6)" strokeWidth="2.5" strokeDasharray="6 3" />

      <text x="170" y="113" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">f(n) = g(n) + h(n)</text>
    </svg>
  )
}

function DFSArtwork({ from, to }: { from: string; to: string }) {
  const id = 'ai-dfs-grad'
  const nodes = [
    { cx: 50,  cy: 60,  label: 'A' },
    { cx: 130, cy: 30,  label: 'B' },
    { cx: 130, cy: 90,  label: 'C' },
    { cx: 210, cy: 15,  label: 'D' },
    { cx: 210, cy: 55,  label: 'E' },
    { cx: 210, cy: 90,  label: 'F' },
    { cx: 290, cy: 30,  label: 'G' },
  ]
  const visited = ['A', 'B', 'D', 'G']
  const stack = ['E', 'C']

  return (
    <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <marker id="dfs-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="rgba(255,255,255,0.4)" />
        </marker>
      </defs>
      <rect width="340" height="120" fill={`url(#${id})`} />

      {/* Stack panel */}
      <rect x="295" y="60" width="38" height="52" rx="3"
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="314" y="73" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">stack</text>
      {stack.map((s, i) => (
        <text key={s} x="314" y={90 + i * 14} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">{s}</text>
      ))}

      {/* Edges */}
      {([
        [68,60,112,38],[68,60,112,82],
        [148,30,192,22],[148,30,192,52],
        [148,90,192,90],
        [228,22,272,32],
      ] as number[][]).map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" markerEnd="url(#dfs-arr)" />
      ))}

      {/* Nodes */}
      {nodes.map(n => {
        const isVisited = visited.includes(n.label)
        const isInStack = stack.includes(n.label)
        const fill = isVisited
          ? 'rgba(34,197,94,0.65)'
          : isInStack
          ? 'rgba(99,102,241,0.65)'
          : 'rgba(255,255,255,0.1)'
        return (
          <g key={n.label}>
            <circle cx={n.cx} cy={n.cy} r={16} fill={fill} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            <text x={n.cx} y={n.cy + 4} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">{n.label}</text>
          </g>
        )
      })}

      <text x="160" y="113" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">visited=green · in-stack=indigo</text>
    </svg>
  )
}
