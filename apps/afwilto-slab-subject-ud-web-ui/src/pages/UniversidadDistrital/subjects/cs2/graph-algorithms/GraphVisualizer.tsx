import { computeCircularLayout } from './graph-layout'
import type { AlgorithmMode } from './types'
import type { ShortestPathResult, MSTResult } from '@/application/ports/IGraphAlgoService'

const CANVAS_W = 600
const CANVAS_H = 340

// Dark-on-light colors (light canvas §4.5)
const COLOR_EDGE_DEFAULT  = 'rgba(24,29,53,0.2)'
const COLOR_EDGE_SP       = 'rgba(37,99,235,0.85)'
const COLOR_EDGE_MST      = 'rgba(22,163,74,0.85)'
const COLOR_VERTEX_FILL   = 'rgba(255,255,255,0.85)'
const COLOR_VERTEX_STROKE = 'rgba(0,0,0,0.18)'
const COLOR_VERTEX_SOURCE = 'rgba(37,99,235,0.15)'
const COLOR_LABEL         = 'rgba(24,29,53,0.85)'
const COLOR_WEIGHT        = 'rgba(24,29,53,0.5)'

interface GraphVisualizerProps {
  n: number
  matrix: number[][]
  mode: AlgorithmMode
  spResult: ShortestPathResult | null
  mstResult: MSTResult | null
}

function edgeKey(from: number, to: number): string {
  return `${Math.min(from, to)}-${Math.max(from, to)}`
}

export function GraphVisualizer({ n, matrix, mode, spResult, mstResult }: GraphVisualizerProps) {
  const radius = n <= 1 ? 0 : Math.min(CANVAS_W, CANVAS_H) * (n <= 4 ? 0.28 : 0.33)
  const positions = computeCircularLayout(n, CANVAS_W / 2, CANVAS_H / 2, radius)

  const highlightedKeys = new Set<string>()
  if (mode === 'shortest-path' && spResult) {
    spResult.shortestPathTree.forEach(e => highlightedKeys.add(edgeKey(e.from, e.to)))
  }
  if (mode === 'mst' && mstResult) {
    mstResult.edges.forEach(e => highlightedKeys.add(edgeKey(e.from, e.to)))
  }

  const VERTEX_R = n > 12 ? 10 : 14

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {n === 0 && (
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(58,77,174,0.5)" fontSize="13" fontFamily="monospace"
        >
          Set the vertex count above to start
        </text>
      )}

      {/* Edges */}
      {Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => {
          if (j <= i) return null
          const w = matrix[i]?.[j] ?? 0
          if (w === 0) return null
          const p1 = positions[i], p2 = positions[j]
          if (!p1 || !p2) return null
          const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
          const isHighlighted = highlightedKeys.has(edgeKey(i, j))
          const edgeColor = isHighlighted
            ? (mode === 'shortest-path' ? COLOR_EDGE_SP : COLOR_EDGE_MST)
            : COLOR_EDGE_DEFAULT
          return (
            <g key={`e-${i}-${j}`}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={edgeColor}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
              />
              <text
                x={mx} y={my - 5}
                textAnchor="middle" dominantBaseline="auto"
                fill={isHighlighted ? edgeColor : COLOR_WEIGHT}
                fontSize={10} fontFamily="monospace" fontWeight={isHighlighted ? '700' : '400'}
              >
                {w}
              </text>
            </g>
          )
        })
      )}

      {/* Vertices */}
      {positions.map(pos => {
        const isSource = mode === 'shortest-path' && spResult && pos.id === spResult.source
        const dist = spResult?.distances[String(pos.id)]
        const distLabel = dist === undefined ? '' : dist === -1 ? ': ∞' : `: ${dist}`
        return (
          <g key={`v-${pos.id}`}>
            <circle
              cx={pos.x} cy={pos.y} r={VERTEX_R}
              fill={isSource ? COLOR_VERTEX_SOURCE : COLOR_VERTEX_FILL}
              stroke={isSource ? COLOR_EDGE_SP : COLOR_VERTEX_STROKE}
              strokeWidth={isSource ? 2 : 1.5}
            />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle" dominantBaseline="middle"
              fill={COLOR_LABEL}
              fontSize={n > 12 ? 8 : 10} fontFamily="monospace" fontWeight="700"
            >
              {pos.id + 1}{mode === 'shortest-path' && spResult ? distLabel : ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
