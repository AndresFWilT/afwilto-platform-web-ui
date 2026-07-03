import { useState, useCallback } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { AVLCursorSetup } from './AVLCursorSetup'
import { AVLCursorOperations } from './AVLCursorOperations'
import { AVLCursorTable } from './AVLCursorTable'
import type { CursorState, CursorOperationResult } from '@/application/ports/IAVLCursorService'

const PROJECT = CS2_PROJECTS.find((p) => p.slug === 'avl-cursor')!

export function AVLCursorPage() {
  const { avlCursorService } = useServices()

  const [cursor, setCursor] = useState<CursorState | null>(null)
  const [lastResult, setLastResult] = useState<CursorOperationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInitialize = useCallback(async (name: string, capacity: number) => {
    setLoading(true)
    setError(null)
    setLastResult(null)
    try {
      const state = await avlCursorService.initialize(name, capacity)
      setCursor(state)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Initialization failed')
    } finally {
      setLoading(false)
    }
  }, [avlCursorService])

  const handleInsert = useCallback(async (key: string) => {
    if (!cursor) return
    setLoading(true)
    setError(null)
    try {
      const result = await avlCursorService.insert(cursor, key)
      setCursor(result.cursor)
      setLastResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Insert failed')
    } finally {
      setLoading(false)
    }
  }, [cursor, avlCursorService])

  const handleDelete = useCallback(async (key: string) => {
    if (!cursor) return
    setLoading(true)
    setError(null)
    try {
      const result = await avlCursorService.delete(cursor, key)
      setCursor(result.cursor)
      setLastResult(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }, [cursor, avlCursorService])

  return (
    <CS2ProjectPage project={PROJECT}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">AVL Cursor Table</Text>
          <Badge variant="primary" size="sm">Live</Badge>
          {cursor && (
            <Text variant="caption" color="muted">
              {cursor.name} · capacity {cursor.capacity}
            </Text>
          )}
        </div>
        <Text variant="caption" color="muted">
          The AVL tree lives in a fixed-size flat array. Each slot stores a key, left/right child indices, and a balance factor. Slot 0 is metadata; slots 1…capacity−1 are data. Comparison uses the letter-sum key (a=1…z=26).
        </Text>

        <AVLCursorSetup disabled={loading} onInitialize={handleInitialize} />

        {cursor && (
          <>
            <AVLCursorOperations
              disabled={loading}
              onInsert={handleInsert}
              onDelete={handleDelete}
            />

            {error && (
              <Alert variant="error" title="Error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Card
              padding="md"
              className="relative"
              style={{ backgroundColor: 'var(--color-surface-raised)' }}
            >
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(24,29,53,0.6)' }}>
                  <Spinner size="md" />
                </div>
              )}
              <AVLCursorTable cursor={cursor} lastResult={lastResult} />
            </Card>
          </>
        )}
      </div>
    </CS2ProjectPage>
  )
}
