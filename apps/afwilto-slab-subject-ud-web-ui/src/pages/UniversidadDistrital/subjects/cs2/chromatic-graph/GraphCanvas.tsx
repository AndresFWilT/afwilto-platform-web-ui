import type { UIVertex } from './types'
import type { VertexColor } from '@/application/ports/IChromaticGraphService'
import { CHROMATIC_PALETTE } from './palette'

// Fixed workspace dimensions — the card is a scrollable window into this space.
export const CANVAS_W = 1400
export const CANVAS_H = 500

const R = 18

interface GraphCanvasProps {
  vertices: UIVertex[]
  matrix: number[][]
  vertexColors?: VertexColor[]
  highlightOrder?: number[]
  onAddVertex?: (x: number, y: number) => void
}

export function GraphCanvas({ vertices, matrix, vertexColors, highlightOrder, onAddVertex }: GraphCanvasProps) {
  const colorMap = new Map<number, number>(
    vertexColors?.map(vc => [vc.vertexId, vc.colorIndex])
  )

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onAddVertex) return
    const svg = e.currentTarget
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    // getScreenCTM().inverse() maps screen px → SVG user units correctly
    // even when the canvas is scrolled inside its overflow container.
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const { x, y } = pt.matrixTransform(ctm.inverse())
    onAddVertex(x, y)
  }

  return (
    <svg
      width={CANVAS_W}
      height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      onClick={handleClick}
      style={{ display: 'block', cursor: onAddVertex ? 'crosshair' : 'default' }}
      aria-label="Graph canvas"
    >
      {/* Edges */}
      {vertices.map((v, i) =>
        vertices.map((u, j) => {
          if (j <= i) return null
          if (!matrix[i]?.[j]) return null
          return (
            <line
              key={`e-${i}-${j}`}
              x1={v.x} y1={v.y} x2={u.x} y2={u.y}
              stroke="rgba(24,29,53,0.35)"
              strokeWidth={2}
            />
          )
        })
      )}

      {/* Vertices */}
      {vertices.map(v => {
        const colorIdx = colorMap.get(v.id)
        const fill = colorIdx !== undefined ? CHROMATIC_PALETTE[colorIdx] : '#F0F2FB'
        const order = highlightOrder?.indexOf(v.id) ?? -1
        return (
          <g key={v.id}>
            {colorIdx !== undefined && (
              <circle cx={v.x} cy={v.y} r={R + 4} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1.5} />
            )}
            <circle cx={v.x} cy={v.y} r={R} fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
            <text
              x={v.x} y={v.y}
              dominantBaseline="middle" textAnchor="middle"
              fontSize={12} fontFamily="monospace" fontWeight="700"
              fill={colorIdx !== undefined ? '#000' : '#181D35'}
            >
              {v.id + 1}
            </text>
            {order >= 0 && (
              <text x={v.x + R + 3} y={v.y - R} fontSize={9} fontFamily="monospace" fill="#C41E3A" fontWeight="700">
                {order + 1}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
