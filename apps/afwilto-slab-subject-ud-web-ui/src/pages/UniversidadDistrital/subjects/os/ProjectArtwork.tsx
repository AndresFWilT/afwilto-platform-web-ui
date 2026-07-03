import type { OSProject } from './data'

interface ArtworkProps {
  project: OSProject
  className?: string
}

export function ProjectArtwork({ project, className = '' }: ArtworkProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {project.slug === 'mlfq-scheduler' && <MLFQArtwork from={project.gradientFrom} to={project.gradientTo} />}
      {project.slug === 'round-robin' && <RoundRobinArtwork from={project.gradientFrom} to={project.gradientTo} />}
    </div>
  )
}

function MLFQArtwork({ from, to }: { from: string; to: string }) {
  const id = 'os-mlfq-grad'
  const queues = [
    { label: 'Q1 RR', y: 20, processes: [{x: 80, w: 28}, {x: 118, w: 22}], color: 'rgba(99,102,241,0.7)' },
    { label: 'Q2 SJF', y: 57, processes: [{x: 80, w: 20}, {x: 110, w: 32}], color: 'rgba(34,197,94,0.7)' },
    { label: 'Q3 FCFS', y: 94, processes: [{x: 80, w: 40}, {x: 130, w: 25}], color: 'rgba(245,158,11,0.7)' },
  ]
  return (
    <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="340" height="120" fill={`url(#${id})`} />

      {/* CPU box */}
      <rect x="10" y="44" width="46" height="32" rx="5"
        fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <text x="33" y="64" textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">CPU</text>

      {/* Queue strips */}
      {queues.map((q) => (
        <g key={q.label}>
          <rect x="68" y={q.y} width="200" height="18" rx="3"
            fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <text x="72" y={q.y + 12} fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">{q.label}</text>
          {q.processes.map((p, i) => (
            <rect key={i} x={p.x} y={q.y + 2} width={p.w} height={14} rx="2"
              fill={q.color} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          ))}
        </g>
      ))}

      {/* Arrows from CPU to queues */}
      <line x1="56" y1="60" x2="68" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

      {/* Downward arrows (demotion) */}
      <path d="M 272 28 Q 282 44 272 57" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#marr)" />
      <path d="M 272 65 Q 282 80 272 94" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" markerEnd="url(#marr)" />

      {/* Upward arrows (aging promotion) */}
      <path d="M 285 94 Q 310 70 285 57" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#marrp)" />
      <path d="M 285 57 Q 310 38 285 28" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#marrp)" />

      <text x="316" y="76" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">age↑</text>

      <defs>
        <marker id="marr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M 0 0 L 5 2.5 L 0 5 Z" fill="rgba(255,255,255,0.35)" />
        </marker>
        <marker id="marrp" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">
          <path d="M 0 0 L 5 2.5 L 0 5 Z" fill="rgba(255,255,255,0.6)" />
        </marker>
      </defs>
    </svg>
  )
}

function RoundRobinArtwork({ from, to }: { from: string; to: string }) {
  const id = 'os-rr-grad'
  const processes = [
    { label: 'P1', cx: 100, cy: 60, r: 22, remaining: '8' },
    { label: 'P2', cx: 165, cy: 38, r: 18, remaining: '3' },
    { label: 'P3', cx: 230, cy: 60, r: 24, remaining: '12' },
    { label: 'P4', cx: 270, cy: 95, r: 16, remaining: '5' },
  ]
  return (
    <svg viewBox="0 0 340 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="340" height="120" fill={`url(#${id})`} />

      {/* CPU box */}
      <rect x="12" y="44" width="52" height="32" rx="6"
        fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      <text x="38" y="63" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">CPU</text>

      {/* Arrow from CPU to first process */}
      <line x1="64" y1="60" x2="78" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" markerEnd="url(#arr)" />

      {/* Process circles */}
      {processes.map((p) => (
        <g key={p.label}>
          <circle cx={p.cx} cy={p.cy} r={p.r}
            fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
          <text x={p.cx} y={p.cy - 3} textAnchor="middle" fill="white" fontSize="8" fontFamily="monospace" fontWeight="bold">{p.label}</text>
          <text x={p.cx} y={p.cy + 9} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="7" fontFamily="monospace">{p.remaining}</text>
        </g>
      ))}

      {/* Circular arrows between processes */}
      <path d="M 122 60 Q 143 20 165 38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
        markerEnd="url(#arr)" />
      <path d="M 183 38 Q 210 22 230 60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
        markerEnd="url(#arr)" />
      <path d="M 248 68 Q 264 82 270 79" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
        markerEnd="url(#arr)" />
      {/* Back-arrow looping to CPU */}
      <path d="M 270 111 Q 200 118 100 82 Q 60 80 38 76" fill="none"
        stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr)" />

      {/* Legend: quantum */}
      <rect x="285" y="10" width="48" height="18" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      <text x="309" y="22" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="7" fontFamily="monospace">Q = 5</text>

      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="rgba(255,255,255,0.5)" />
        </marker>
      </defs>
    </svg>
  )
}
