import { computeLayerLayout } from './types'
import type { InDegreeInfo } from '@/application/ports/ITopologicalSortService'

const CANVAS_W = 640
const CANVAS_H = 320
const VERTEX_R  = 14
const LAYER_GAP = 120
const VERTEX_GAP = 56

// Dark-on-light colors (light canvas exception §4.5)
const COLOR_EDGE    = 'rgba(24,29,53,0.2)'
const COLOR_FILL    = 'rgba(255,255,255,0.85)'
const COLOR_STROKE  = 'rgba(0,0,0,0.18)'
const COLOR_LABEL   = 'rgba(24,29,53,0.85)'
const COLOR_ARROW   = 'rgba(24,29,53,0.25)'
const COLOR_SOURCE_STROKE = 'rgba(22,163,74,0.85)'
const COLOR_SOURCE_FILL   = 'rgba(22,163,74,0.1)'

interface DAGVisualizerProps {
  n: number
  adjacencyList: Record<number, number[]>
  inDegrees?: InDegreeInfo[]
}

export function DAGVisualizer({ n, adjacencyList, inDegrees }: DAGVisualizerProps) {
  if (n === 0) {
    return (
      <svg viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet">
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill="rgba(58,77,174,0.5)" fontSize="13" fontFamily="monospace">
          Set vertex count to start
        </text>
      </svg>
    )
  }

  // Build layers from in-degrees (post-sort) or just horizontal sequence
  const layers: number[][] = inDegrees
    ? computeLayerLayout(n, adjacencyList, inDegrees)
    : [Array.from({ length: n }, (_, i) => i)]

  // Ensure all vertices appear (disconnected vertices not in any layer)
  const layered = new Set(layers.flat())
  const extra = Array.from({ length: n }, (_, i) => i).filter(v => !layered.has(v))
  if (extra.length > 0) layers.push(extra)

  const numLayers    = layers.length
  const maxPerLayer  = Math.max(...layers.map(l => l.length))
  const svgW         = Math.max(CANVAS_W, numLayers * LAYER_GAP + 60)
  const svgH         = Math.max(CANVAS_H, maxPerLayer * VERTEX_GAP + 40)

  // Compute positions: layer i → column, position j within layer → row
  const pos = new Map<number, { x: number; y: number }>()
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    const x = 40 + i * LAYER_GAP + LAYER_GAP / 2
    for (let j = 0; j < layer.length; j++) {
      const y = 20 + ((j + 0.5) * (svgH - 40)) / Math.max(layer.length, 1)
      pos.set(layer[j], { x, y })
    }
  }

  const sourceSet = new Set(inDegrees?.filter(d => d.initialInDegree === 0).map(d => d.vertex) ?? [])

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="topo-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={COLOR_ARROW} />
        </marker>
      </defs>

      {/* Layer labels */}
      {layers.map((_, i) => (
        <text key={i} x={40 + i * LAYER_GAP + LAYER_GAP / 2} y={14}
          textAnchor="middle" fill="rgba(24,29,53,0.35)" fontSize="9" fontFamily="monospace">
          L{i}
        </text>
      ))}

      {/* Directed edges */}
      {Array.from({ length: n }, (_, u) =>
        (adjacencyList[u] ?? []).map(v => {
          const p1 = pos.get(u), p2 = pos.get(v)
          if (!p1 || !p2 || u === v) return null
          const dx = p2.x - p1.x, dy = p2.y - p1.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const ux = dx / len, uy = dy / len
          const x1 = p1.x + ux * VERTEX_R, y1 = p1.y + uy * VERTEX_R
          const x2 = p2.x - ux * (VERTEX_R + 2), y2 = p2.y - uy * (VERTEX_R + 2)
          return (
            <line key={`${u}-${v}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={COLOR_EDGE} strokeWidth={1.5}
              markerEnd="url(#topo-arrow)"
            />
          )
        })
      )}

      {/* Vertices */}
      {Array.from({ length: n }, (_, v) => {
        const p = pos.get(v)
        if (!p) return null
        const isSource = sourceSet.has(v)
        return (
          <g key={v}>
            <circle cx={p.x} cy={p.y} r={VERTEX_R}
              fill={isSource ? COLOR_SOURCE_FILL : COLOR_FILL}
              stroke={isSource ? COLOR_SOURCE_STROKE : COLOR_STROKE}
              strokeWidth={isSource ? 2 : 1.5}
            />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill={COLOR_LABEL} fontSize={10} fontFamily="monospace" fontWeight="700">
              {v + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
