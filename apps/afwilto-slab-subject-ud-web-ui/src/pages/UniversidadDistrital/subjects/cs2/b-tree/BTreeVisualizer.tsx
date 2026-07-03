import { Text } from '@afwilto/design-system'
import type { BTree, BTreePathStep } from '@/application/ports/IBTreeService'
import { layoutBTree, LAYOUT } from './btree-layout'
import type { LayoutNode } from './types'

interface BTreeVisualizerProps {
  tree: BTree
  affectedPath: BTreePathStep[]
}

// Keys on the affected path, used to highlight visited nodes.
function pathKeySet(path: BTreePathStep[]): Set<string> {
  const s = new Set<string>()
  for (const step of path) s.add(step.nodeKeys.join(''))
  return s
}

export function BTreeVisualizer({ tree, affectedPath }: BTreeVisualizerProps) {
  const layout = layoutBTree(tree)
  const highlighted = pathKeySet(affectedPath)

  if (!layout.root) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <Text variant="body" className="text-brand-400">
          Empty tree — insert a key to begin.
        </Text>
      </div>
    )
  }

  const edges: React.ReactNode[] = []
  const nodes: React.ReactNode[] = []

  const walk = (ln: LayoutNode) => {
    const isHit = highlighted.has(ln.keys.join(''))

    // Edges to children (draw first so nodes paint on top).
    ln.children.forEach((child) => {
      edges.push(
        <line
          key={`e-${ln.x}-${ln.y}-${child.x}-${child.y}`}
          x1={ln.x}
          y1={ln.y + LAYOUT.NODE_HEIGHT}
          x2={child.x}
          y2={child.y}
          stroke="rgba(24,29,53,0.25)"
          strokeWidth={1.5}
        />,
      )
      walk(child)
    })

    const boxX = ln.x - ln.width / 2
    nodes.push(
      <g key={`n-${ln.x}-${ln.y}`}>
        <rect
          x={boxX}
          y={ln.y}
          width={ln.width}
          height={LAYOUT.NODE_HEIGHT}
          rx={6}
          fill={isHit ? 'var(--color-primary-400)' : '#ffffff'}
          stroke={isHit ? 'var(--color-primary-600)' : 'rgba(0,0,0,0.18)'}
          strokeWidth={isHit ? 2 : 1}
        />
        {ln.keys.map((k, i) => (
          <g key={`k-${k}`}>
            {i > 0 && (
              <line
                x1={boxX + LAYOUT.NODE_PADDING + i * LAYOUT.KEY_WIDTH}
                y1={ln.y + 6}
                x2={boxX + LAYOUT.NODE_PADDING + i * LAYOUT.KEY_WIDTH}
                y2={ln.y + LAYOUT.NODE_HEIGHT - 6}
                stroke="rgba(0,0,0,0.12)"
                strokeWidth={1}
              />
            )}
            <text
              x={boxX + LAYOUT.NODE_PADDING + i * LAYOUT.KEY_WIDTH + LAYOUT.KEY_WIDTH / 2}
              y={ln.y + LAYOUT.NODE_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={600}
              fill={isHit ? '#ffffff' : '#181D35'}
              fontFamily="ui-monospace, monospace"
            >
              {k}
            </text>
          </g>
        ))}
      </g>,
    )
  }

  walk(layout.root)

  return (
    <div className="overflow-auto" style={{ maxHeight: 520 }}>
      <div style={{ minWidth: layout.width, minHeight: layout.height }}>
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="img"
          aria-label="B-Tree structure"
        >
          {edges}
          {nodes}
        </svg>
      </div>
    </div>
  )
}
