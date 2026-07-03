import React from 'react'
import type { OR1Project } from './data'

interface SvgProps { from: string; to: string }

function GraphicalMethodArtwork({ from, to }: SvgProps) {
  const id = 'gm-grad'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* Axes */}
      <line x1="30" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <line x1="30" y1="100" x2="30" y2="15" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      {/* Constraint lines */}
      <line x1="30" y1="30" x2="130" y2="100" stroke="rgba(251,191,36,0.7)" strokeWidth="1.5" />
      <line x1="30" y1="55" x2="165" y2="100" stroke="rgba(167,139,250,0.7)" strokeWidth="1.5" />
      <line x1="30" y1="72" x2="140" y2="20" stroke="rgba(52,211,153,0.7)" strokeWidth="1.5" />
      {/* Feasible region */}
      <polygon
        points="30,100 90,100 115,68 70,38 30,55"
        fill="rgba(59,130,246,0.2)"
        stroke="rgba(59,130,246,0.5)"
        strokeWidth="1"
      />
      {/* Optimal point */}
      <circle cx="70" cy="38" r="4" fill="#22c55e" stroke="white" strokeWidth="1.5" />
      {/* Labels */}
      <text x="35" y="108" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">x</text>
      <text x="22" y="18" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">y</text>
      <text x="73" y="34" fontSize="7" fill="#22c55e" fontFamily="monospace">Z*</text>
    </svg>
  )
}

function MIPArtwork({ from, to }: SvgProps) {
  const id = 'mip-grad'
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#${id})`} />
      {/* B&B tree nodes */}
      {/* Root */}
      <rect x="82" y="10" width="36" height="18" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <text x="100" y="22" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">LP=21</text>
      {/* Level 1 left */}
      <rect x="38" y="44" width="36" height="18" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <text x="56" y="56" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">x≤1</text>
      {/* Level 1 right */}
      <rect x="126" y="44" width="36" height="18" rx="3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <text x="144" y="56" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">x≥2</text>
      {/* Lines root→children */}
      <line x1="100" y1="28" x2="56" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="100" y1="28" x2="144" y2="44" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Level 2 */}
      <rect x="18" y="78" width="36" height="18" rx="3" fill="rgba(34,197,94,0.3)" stroke="rgba(34,197,94,0.6)" strokeWidth="1" />
      <text x="36" y="90" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">Z=20 ✓</text>
      <rect x="58" y="78" width="36" height="18" rx="3" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <text x="76" y="90" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="monospace">prune</text>
      <rect x="126" y="78" width="36" height="18" rx="3" fill="rgba(239,68,68,0.25)" stroke="rgba(239,68,68,0.5)" strokeWidth="1" />
      <text x="144" y="90" textAnchor="middle" fontSize="7" fill="white" fontFamily="monospace">infeas</text>
      <line x1="56" y1="62" x2="36" y2="78" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="56" y1="62" x2="76" y2="78" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1="144" y1="62" x2="144" y2="78" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    </svg>
  )
}

const ARTWORK: Record<string, (props: SvgProps) => React.ReactElement> = {
  'graphical-method': GraphicalMethodArtwork,
  'mixed-integer': MIPArtwork,
}

interface Props {
  project: OR1Project
  className?: string
}

export function ProjectArtwork({ project, className = '' }: Props) {
  const Component = ARTWORK[project.slug]
  if (!Component) return <div className={`bg-surface-overlay ${className}`} />
  return (
    <div className={className}>
      <Component from={project.gradientFrom} to={project.gradientTo} />
    </div>
  )
}
