import { useState, useCallback } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { BTreeSetup } from './BTreeSetup'
import { BTreeOperations } from './BTreeOperations'
import { BTreeVisualizer } from './BTreeVisualizer'
import type { BTree, BTreePathStep } from '@/application/ports/IBTreeService'

const PROJECT = CS2_PROJECTS.find((p) => p.slug === 'b-tree')!

const emptyTree = (order: number): BTree => ({ order, root: { keys: [], children: [] } })

function keyCount(node: BTree['root']): number {
  return node.keys.length + node.children.reduce((sum, c) => sum + keyCount(c), 0)
}

export function BTreePage() {
  const { bTreeService } = useServices()

  const [tree, setTree] = useState<BTree | null>(null)
  const [affectedPath, setAffectedPath] = useState<BTreePathStep[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const initialize = useCallback((order: number) => {
    setTree(emptyTree(order))
    setAffectedPath([])
    setError(null)
    setNotice(null)
  }, [])

  const run = useCallback(
    async (op: 'insert' | 'delete' | 'find', key: string) => {
      if (!tree) return
      setLoading(true)
      setError(null)
      setNotice(null)
      try {
        const result = await bTreeService[op](tree, key)
        // find leaves the tree unchanged; insert/delete return the new tree.
        setTree(result.tree)
        setAffectedPath(result.operation.affectedPath)
        if (op === 'find') {
          setNotice(`Key "${key}" found — path highlighted below.`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Operation failed')
      } finally {
        setLoading(false)
      }
    },
    [tree, bTreeService],
  )

  return (
    <CS2ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">Interactive B-Tree</Text>
          <Badge variant="primary" size="sm">Live</Badge>
          {tree && (
            <Text variant="caption" color="muted">
              order t={tree.order} · {keyCount(tree.root)} keys
            </Text>
          )}
        </div>
        <Text variant="caption" color="muted">
          Bayer-McCreight B-Tree (keys in every node, no leaf chain). Keys are strings, sorted lexicographically.
        </Text>

        <BTreeSetup order={tree?.order ?? 2} disabled={loading} onInitialize={initialize} />

        {tree && (
          <>
            <BTreeOperations
              disabled={loading}
              onInsert={(k) => run('insert', k)}
              onDelete={(k) => run('delete', k)}
              onFind={(k) => run('find', k)}
            />

            {error && (
              <Alert variant="error" title="Error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {notice && !error && (
              <Alert variant="success" title="Found" onClose={() => setNotice(null)}>
                {notice}
              </Alert>
            )}

            <Card
              padding="md"
              className="relative"
              style={{ backgroundColor: 'var(--color-brand-50)' }}
            >
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
                  <Spinner size="md" />
                </div>
              )}
              <BTreeVisualizer tree={tree} affectedPath={affectedPath} />
            </Card>
          </>
        )}
      </div>
    </CS2ProjectPage>
  )
}
