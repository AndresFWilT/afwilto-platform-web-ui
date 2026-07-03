import { useState } from 'react'
import { Card, Text } from '@afwilto/design-system'
import type { NaryTree, BinaryTree } from '@/application/ports/ILCRSService'
import { layoutNaryTree, NARY_LAYOUT } from './nary-layout'
import { layoutBinaryTree, BINARY_LAYOUT } from './binary-layout'
import type { LayoutNaryNode, LayoutBinaryNode } from './types'

interface DualTreeVisualizerProps {
  naryTree: NaryTree | null
  binaryTree: BinaryTree | null
  shortestPath: string[] | null
}

const R = NARY_LAYOUT.NODE_RADIUS
const BR = BINARY_LAYOUT.NODE_RADIUS

export function DualTreeVisualizer({ naryTree, binaryTree, shortestPath }: DualTreeVisualizerProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const pathSet = new Set(shortestPath ?? [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NaryPanel naryTree={naryTree} pathSet={pathSet} hovered={hovered} onHover={setHovered} />
      <BinaryPanel binaryTree={binaryTree} pathSet={pathSet} hovered={hovered} onHover={setHovered} />
    </div>
  )
}

// ── N-ary panel ───────────────────────────────────────────────────────────────

function NaryPanel({ naryTree, pathSet, hovered, onHover }: {
  naryTree: NaryTree | null
  pathSet: Set<string>
  hovered: string | null
  onHover: (l: string | null) => void
}) {
  const layout = naryTree ? layoutNaryTree(naryTree) : { root: null, width: 0, height: 0 }
  return (
    <Card padding="none" className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-brand-50)' }}>
      <div className="px-3 py-2 border-b border-black/10">
        <Text variant="caption" color="muted" className="font-semibold">N-ary Tree</Text>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 340 }}>
        {!layout.root ? (
          <div className="flex h-32 items-center justify-center">
            <Text variant="caption" color="muted">Build a tree and click Transform.</Text>
          </div>
        ) : (
          <div style={{ minWidth: layout.width, minHeight: layout.height }}>
            <svg width={layout.width} height={layout.height} aria-label="N-ary tree">
              <NaryNodeSvg node={layout.root} pathSet={pathSet} hovered={hovered} onHover={onHover} />
            </svg>
          </div>
        )}
      </div>
    </Card>
  )
}

function NaryNodeSvg({ node, pathSet, hovered, onHover }: {
  node: LayoutNaryNode
  pathSet: Set<string>
  hovered: string | null
  onHover: (l: string | null) => void
}) {
  const isPath = pathSet.has(node.label)
  const isHovered = hovered === node.label
  return (
    <g>
      {node.children.map(({ node: child, weight }, i) => {
        const mx = (node.x + child.x) / 2
        const my = (node.y + child.y) / 2
        return (
          <g key={i}>
            <line x1={node.x} y1={node.y + R} x2={child.x} y2={child.y - R}
              stroke={pathSet.has(node.label) && pathSet.has(child.label) ? 'var(--color-primary-400)' : 'rgba(24,29,53,0.25)'}
              strokeWidth={2} />
            <text x={mx + 4} y={my} fontSize={10} fill="rgba(24,29,53,0.6)" fontFamily="monospace">{weight}</text>
            <NaryNodeSvg node={child} pathSet={pathSet} hovered={hovered} onHover={onHover} />
          </g>
        )
      })}
      <circle cx={node.x} cy={node.y} r={R}
        fill={isPath ? 'var(--color-primary-400)' : isHovered ? 'var(--color-primary-300)' : '#ffffff'}
        stroke={isHovered ? 'var(--color-primary-500)' : 'rgba(0,0,0,0.18)'}
        strokeWidth={isHovered ? 2.5 : 1.5}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => onHover(node.label)}
        onMouseLeave={() => onHover(null)}
      />
      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
        fontSize={13} fontWeight={600} fill={isPath ? '#fff' : '#181D35'} fontFamily="ui-monospace, monospace"
        style={{ pointerEvents: 'none' }}>
        {node.label}
      </text>
    </g>
  )
}

// ── Binary (LCRS) panel ───────────────────────────────────────────────────────

function BinaryPanel({ binaryTree, pathSet, hovered, onHover }: {
  binaryTree: BinaryTree | null
  pathSet: Set<string>
  hovered: string | null
  onHover: (l: string | null) => void
}) {
  const layout = binaryTree ? layoutBinaryTree(binaryTree) : { root: null, width: 0, height: 0 }
  return (
    <Card padding="none" className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-brand-50)' }}>
      <div className="px-3 py-2 border-b border-black/10">
        <Text variant="caption" color="muted" className="font-semibold">LCRS Binary Tree</Text>
        <Text variant="caption" color="muted"> — ↙ first child · → next sibling</Text>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 340 }}>
        {!layout.root ? (
          <div className="flex h-32 items-center justify-center">
            <Text variant="caption" color="muted">Transform the N-ary tree first.</Text>
          </div>
        ) : (
          <div style={{ minWidth: layout.width, minHeight: layout.height }}>
            <svg width={layout.width} height={layout.height} aria-label="LCRS binary tree">
              <BinaryNodeSvg node={layout.root} pathSet={pathSet} hovered={hovered} onHover={onHover} isLeft={true} />
            </svg>
          </div>
        )}
      </div>
    </Card>
  )
}

function BinaryNodeSvg({ node, pathSet, hovered, onHover, isLeft }: {
  node: LayoutBinaryNode | null
  pathSet: Set<string>
  hovered: string | null
  onHover: (l: string | null) => void
  isLeft: boolean
}) {
  if (!node) return null
  const isPath = pathSet.has(node.label)
  const isHovered = hovered === node.label
  return (
    <g>
      {node.left && (
        <g>
          <line x1={node.x} y1={node.y + BR} x2={node.left.x} y2={node.left.y - BR}
            stroke={isPath && pathSet.has(node.left.label) ? 'var(--color-primary-400)' : 'rgba(24,29,53,0.3)'}
            strokeWidth={2} />
          <text x={(node.x + node.left.x) / 2 - 6} y={(node.y + node.left.y) / 2}
            fontSize={9} fill="rgba(24,29,53,0.5)" fontFamily="monospace">{node.left.weight}</text>
          <BinaryNodeSvg node={node.left} pathSet={pathSet} hovered={hovered} onHover={onHover} isLeft={true} />
        </g>
      )}
      {node.right && (
        <g>
          <line x1={node.x + BR} y1={node.y} x2={node.right.x - BR} y2={node.right.y}
            stroke="rgba(24,29,53,0.2)" strokeWidth={1.5} strokeDasharray="5 3" />
          <text x={(node.x + node.right.x) / 2} y={node.y - 4}
            fontSize={9} fill="rgba(24,29,53,0.4)" fontFamily="monospace">{node.right.weight}</text>
          <BinaryNodeSvg node={node.right} pathSet={pathSet} hovered={hovered} onHover={onHover} isLeft={false} />
        </g>
      )}
      <circle cx={node.x} cy={node.y} r={BR}
        fill={isPath ? 'var(--color-primary-400)' : isHovered ? 'var(--color-primary-300)' : '#ffffff'}
        stroke={isHovered ? 'var(--color-primary-500)' : isLeft ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.10)'}
        strokeWidth={isHovered ? 2.5 : isLeft ? 1.5 : 1}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => onHover(node.label)}
        onMouseLeave={() => onHover(null)}
      />
      <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight={600} fill={isPath ? '#fff' : '#181D35'} fontFamily="ui-monospace, monospace"
        style={{ pointerEvents: 'none' }}>
        {node.label}
      </text>
    </g>
  )
}
