import { useMemo } from 'react'
import type { CriticalPathResult } from '@/application/ports/ICriticalPathService'
import { computeLayout, NODE_W, NODE_H } from './network-layout'

interface NetworkGraphProps {
  result: CriticalPathResult
}

const CRITICAL_COLOR  = '#f87171' // error-400
const NORMAL_EDGE     = 'rgba(24,29,53,0.35)'
const NORMAL_BORDER   = 'rgba(24,29,53,0.25)'
const NORMAL_TEXT     = '#1e254a'
const ARROWHEAD_ID    = 'arrow-normal'
const ARROWHEAD_CRIT  = 'arrow-critical'

export function NetworkGraph({ result }: NetworkGraphProps) {
  const layout = useMemo(() => computeLayout(result.schedule), [result])
  const byName = useMemo(() => new Map(result.schedule.map(a => [a.name, a])), [result])

  const minW = 500
  const w = Math.max(layout.width, minW)
  const h = layout.height + 20

  return (
    <div className="overflow-auto w-full" style={{ scrollbarWidth: 'thin' }}>
      <div style={{ minWidth: `${minW}px` }}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <defs>
            <marker id={ARROWHEAD_ID} markerWidth="8" markerHeight="8"
              refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={NORMAL_EDGE} />
            </marker>
            <marker id={ARROWHEAD_CRIT} markerWidth="8" markerHeight="8"
              refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={CRITICAL_COLOR} />
            </marker>
          </defs>

          {/* Edges */}
          {result.schedule.map(a => {
            const toNode = layout.nodes.get(a.name)
            if (!toNode) return null
            return a.predecessors.map(predName => {
              const fromNode = layout.nodes.get(predName)
              if (!fromNode) return null
              const fromAct = byName.get(predName)
              const isCriticalEdge = a.isCritical && fromAct?.isCritical
              const color = isCriticalEdge ? CRITICAL_COLOR : NORMAL_EDGE
              const markerId = isCriticalEdge ? ARROWHEAD_CRIT : ARROWHEAD_ID

              const x1 = fromNode.x + NODE_W
              const y1 = fromNode.y + NODE_H / 2
              const x2 = toNode.x - 8
              const y2 = toNode.y + NODE_H / 2

              return (
                <line key={`${predName}->${a.name}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth={isCriticalEdge ? 2.5 : 1.5}
                  markerEnd={`url(#${markerId})`}
                />
              )
            })
          })}

          {/* Nodes */}
          {result.schedule.map(a => {
            const n = layout.nodes.get(a.name)
            if (!n) return null
            const isCrit = a.isCritical
            const borderColor = isCrit ? CRITICAL_COLOR : NORMAL_BORDER

            const x = n.x
            const y = n.y
            const halfH = NODE_H / 2
            const thirdW = NODE_W / 3

            return (
              <g key={a.name}>
                {/* Outer box */}
                <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={4}
                  fill="white" stroke={borderColor} strokeWidth={isCrit ? 2.5 : 1.5} />

                {/* Horizontal divider */}
                <line x1={x} y1={y + halfH} x2={x + NODE_W} y2={y + halfH}
                  stroke={borderColor} strokeWidth={0.8} />

                {/* Vertical dividers — top row thirds */}
                <line x1={x + thirdW} y1={y} x2={x + thirdW} y2={y + halfH}
                  stroke={borderColor} strokeWidth={0.8} />
                <line x1={x + thirdW * 2} y1={y} x2={x + thirdW * 2} y2={y + halfH}
                  stroke={borderColor} strokeWidth={0.8} />

                {/* Vertical dividers — bottom row thirds */}
                <line x1={x + thirdW} y1={y + halfH} x2={x + thirdW} y2={y + NODE_H}
                  stroke={borderColor} strokeWidth={0.8} />
                <line x1={x + thirdW * 2} y1={y + halfH} x2={x + thirdW * 2} y2={y + NODE_H}
                  stroke={borderColor} strokeWidth={0.8} />

                {/* Top row: ES | Name | EF */}
                <text x={x + thirdW / 2} y={y + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="monospace" fill="#1e3a8a">{a.earlyStart}</text>
                <text x={x + NODE_W / 2} y={y + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={11} fontFamily="monospace" fontWeight="bold"
                  fill={isCrit ? CRITICAL_COLOR : NORMAL_TEXT}>{a.name}</text>
                <text x={x + thirdW * 2 + thirdW / 2} y={y + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="monospace" fill="#1e3a8a">{a.earlyFinish}</text>

                {/* Bottom row: LS | d=X | LF */}
                <text x={x + thirdW / 2} y={y + halfH + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="monospace" fill="#5b21b6">{a.lateStart}</text>
                <text x={x + NODE_W / 2} y={y + halfH + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fontFamily="monospace" fill={NORMAL_TEXT}>d={a.duration}</text>
                <text x={x + thirdW * 2 + thirdW / 2} y={y + halfH + halfH / 2} textAnchor="middle" dominantBaseline="central"
                  fontSize={10} fontFamily="monospace" fill="#5b21b6">{a.lateFinish}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
