import { useState, useCallback } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { HashTableSetup } from './HashTableSetup'
import { HashTableOperations } from './HashTableOperations'
import { HashTableVisualizer } from './HashTableVisualizer'
import { HashTableSummary } from './HashTableSummary'
import type { HashTable, HashEntry, HashOperation } from '@/application/ports/IHashTableService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'hash-table-chaining')!

// ── Page entry point ──────────────────────────────────────────────────────────

export function HashTableChainingPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <HashTableApp />
    </CS2ProjectPage>
  )
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

function HashTableApp() {
  const { hashTableService } = useServices()

  const [table,   setTable]   = useState<HashTable | null>(null)
  const [lastOp,  setLastOp]  = useState<HashOperation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const handleInitialize = useCallback((t: HashTable) => {
    setTable(t)
    setLastOp(null)
    setError(null)
    setWarning(null)
  }, [])

  async function callService(fn: () => Promise<void>) {
    setLoading(true)
    setError(null)
    setWarning(null)
    try {
      await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unexpected error'
      if (msg.includes('already exists') || msg.includes('was not found')) {
        setWarning(msg)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleInsert(entry: HashEntry) {
    if (!table) return
    callService(async () => {
      const res = await hashTableService.insert(table, entry)
      setTable(res.table)
      setLastOp(res.operation)
    })
  }

  function handleDelete(key: number) {
    if (!table) return
    callService(async () => {
      const res = await hashTableService.delete(table, key)
      setTable(res.table)
      setLastOp(res.operation)
    })
  }

  function handleFind(key: number) {
    if (!table) return
    callService(async () => {
      const res = await hashTableService.find(table, key)
      // table is unchanged on find — only update the highlighted location
      setLastOp(res.operation)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Hash Table — Separate Chaining</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Setup */}
      <Card padding="md">
        <HashTableSetup onInitialize={handleInitialize} hasTable={!!table} />
      </Card>

      {/* Feedback */}
      {error   && <Alert variant="error"   onClose={() => setError(null)}>{error}</Alert>}
      {warning && <Alert variant="warning" onClose={() => setWarning(null)}>{warning}</Alert>}

      {/* Active table UI */}
      {table && (
        <>
          {/* Operations */}
          <Card padding="md" className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface-raised/60 backdrop-blur-sm">
                <Spinner size="md" />
              </div>
            )}
            <HashTableOperations
              table={table}
              loading={loading}
              onInsert={handleInsert}
              onDelete={handleDelete}
              onFind={handleFind}
            />
          </Card>

          {/* Last operation banner */}
          {lastOp && (
            <div className="flex items-center gap-3 px-1">
              <Text variant="caption" color="muted" className="uppercase tracking-widest">
                Last operation
              </Text>
              <Badge
                variant={lastOp.type === 'INSERT' ? 'success' : lastOp.type === 'DELETE' ? 'error' : 'primary'}
                size="sm"
              >
                {lastOp.type}
              </Badge>
              <Text variant="caption" color="muted">
                key <span className="font-mono text-neutral-200">{lastOp.key}</span>
                {' '}→ bucket <span className="font-mono text-neutral-200">{lastOp.location.bucketIndex}</span>,
                chain[<span className="font-mono text-neutral-200">{lastOp.location.chainIndex}</span>]
              </Text>
              <Text variant="caption" color="muted" className="ml-auto font-mono">
                {lastOp.key} mod {table.modulus} = {lastOp.location.bucketIndex}
              </Text>
            </div>
          )}

          {/* Visualizer */}
          <div className="flex flex-col gap-2">
            <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
              Bucket chains
            </Text>
            <HashTableVisualizer table={table} lastOp={lastOp} />
          </div>

          {/* Summary stats */}
          <HashTableSummary table={table} />
        </>
      )}
    </div>
  )
}
