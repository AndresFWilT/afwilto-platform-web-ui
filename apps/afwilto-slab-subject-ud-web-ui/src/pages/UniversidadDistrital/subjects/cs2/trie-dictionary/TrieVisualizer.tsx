import { Text } from '@afwilto/design-system'
import type { Trie } from '@/application/ports/ITrieService'
import { layoutTrie, LAYOUT } from './trie-layout'
import type { LayoutTrieNode } from './types'

interface TrieVisualizerProps {
  trie: Trie
  affectedPath: string[]
}

export function TrieVisualizer({ trie, affectedPath }: TrieVisualizerProps) {
  const layout = layoutTrie(trie)
  const pathSet = new Set(affectedPath)

  if (!layout.root) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <Text variant="body" className="text-brand-400">
          Empty trie — insert a word to begin.
        </Text>
      </div>
    )
  }

  const edges: React.ReactNode[] = []
  const nodes: React.ReactNode[] = []

  const walk = (ln: LayoutTrieNode) => {
    const r = LAYOUT.NODE_RADIUS
    const isHit = ln.character !== null && pathSet.has(ln.character)

    ln.children.forEach((child) => {
      edges.push(
        <line
          key={`e-${ln.x}-${ln.y}-${child.x}-${child.y}`}
          x1={ln.x}
          y1={ln.y + r}
          x2={child.x}
          y2={child.y - r}
          stroke="rgba(24,29,53,0.25)"
          strokeWidth={1.5}
        />,
      )
      walk(child)
    })

    const isRoot = ln.character === null
    nodes.push(
      <g key={`n-${ln.x}-${ln.y}`}>
        <circle
          cx={ln.x}
          cy={ln.y}
          r={r}
          fill={
            isRoot
              ? 'rgba(24,29,53,0.08)'
              : isHit
              ? 'var(--color-primary-400)'
              : ln.isTerminal
              ? 'var(--color-success-400)'
              : '#ffffff'
          }
          stroke={
            isHit
              ? 'var(--color-primary-600)'
              : ln.isTerminal
              ? 'var(--color-success-500)'
              : 'rgba(0,0,0,0.18)'
          }
          strokeWidth={isHit ? 2.5 : 1.5}
        />
        <text
          x={ln.x}
          y={ln.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={600}
          fill={isHit || ln.isTerminal ? '#ffffff' : '#181D35'}
          fontFamily="ui-monospace, monospace"
        >
          {isRoot ? '∅' : ln.character}
        </text>
        {ln.isTerminal && ln.translation && (
          <title>{`"${ln.translation}"`}</title>
        )}
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
          aria-label="Trie structure"
        >
          {edges}
          {nodes}
        </svg>
      </div>
    </div>
  )
}
