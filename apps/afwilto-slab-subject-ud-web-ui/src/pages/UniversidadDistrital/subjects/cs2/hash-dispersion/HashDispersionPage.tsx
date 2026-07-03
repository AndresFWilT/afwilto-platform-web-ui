import { useState } from 'react'
import { Text, Button, Card, Alert, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CS2ProjectPage } from '../CS2ProjectPage'
import { CS2_PROJECTS } from '../data'
import { EntryInput } from './EntryInput'
import { BucketHeadsTable } from './BucketHeadsTable'
import { DataArrayTable } from './DataArrayTable'
import type { HashEntry, DispersionTable, SearchResult } from '@/application/ports/IHashDispersionService'

const PROJECT = CS2_PROJECTS.find(p => p.slug === 'hash-dispersion')!

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

function randomValue(): string {
  return ALPHABET[Math.floor(Math.random() * 26)] + ALPHABET[Math.floor(Math.random() * 26)]
}

function generateRandomEntries(): HashEntry[] {
  const keys = new Set<number>()
  while (keys.size < 6) {
    keys.add(Math.floor(Math.random() * 200))
  }
  return Array.from(keys).map(key => ({ key, value: randomValue() }))
}

// ── Page entry point ──────────────────────────────────────────────────────────

export function HashDispersionPage() {
  return (
    <CS2ProjectPage project={PROJECT}>
      <HashDispersionVisualizer />
    </CS2ProjectPage>
  )
}

// ── Main visualizer ───────────────────────────────────────────────────────────

function HashDispersionVisualizer() {
  const { hashDispersionService } = useServices()

  const [modulus, setModulus]     = useState(7)
  const [entries, setEntries]     = useState<HashEntry[]>([])
  const [table, setTable]         = useState<DispersionTable | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [opKey, setOpKey]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function reset() {
    setTable(null)
    setSearchResult(null)
    setEntries([])
    setError(null)
    setOpKey('')
  }

  async function handleDisperse() {
    setLoading(true)
    setError(null)
    setSearchResult(null)
    try {
      const t = await hashDispersionService.disperse(modulus, entries)
      setTable(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    if (!table) return
    const key = parseInt(opKey, 10)
    if (isNaN(key)) { setError('Enter a valid integer key to remove.'); return }
    setLoading(true)
    setError(null)
    setSearchResult(null)
    try {
      const t = await hashDispersionService.remove(table, key)
      setTable(t)
      setOpKey('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!table) return
    const key = parseInt(opKey, 10)
    if (isNaN(key)) { setError('Enter a valid integer key to search.'); return }
    setLoading(true)
    setError(null)
    try {
      const r = await hashDispersionService.search(table, key)
      setSearchResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const highlightModule    = searchResult?.bucketModule
  const highlightPositions = searchResult?.traversalPath

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Hash Dispersion</Text>
        <Badge variant="primary" size="sm">Interactive</Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* Entry input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
            Entries
          </Text>
          {table && (
            <Button variant="secondary" size="sm" onClick={reset} disabled={loading}>
              Reset
            </Button>
          )}
        </div>
        <Card padding="md">
          <EntryInput
            modulus={modulus}
            entries={entries}
            onModulusChange={setModulus}
            onEntriesChange={e => { setEntries(e); setTable(null); setSearchResult(null) }}
            onGenerateRandom={() => setEntries(generateRandomEntries())}
            onDisperse={handleDisperse}
            loading={loading}
          />
        </Card>
      </div>

      {/* Result tables — only shown after disperse */}
      {table && (
        <>
          {/* Operations */}
          <Card padding="md">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <Text variant="caption" color="muted" className="uppercase tracking-widest">Key</Text>
                <input
                  type="number"
                  value={opKey}
                  onChange={e => { setOpKey(e.target.value); setSearchResult(null) }}
                  placeholder="e.g. 45"
                  className="h-9 w-24 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleSearch} disabled={loading || !opKey}>
                  Search
                </Button>
                <Button variant="danger" size="sm" onClick={handleRemove} disabled={loading || !opKey}>
                  Remove
                </Button>
              </div>

              {/* Search result inline */}
              {searchResult && (
                <div className="flex items-center gap-2 ml-auto">
                  {searchResult.found ? (
                    <Badge variant="success" size="sm">
                      Found at pos {searchResult.slotPosition} — visited {searchResult.traversalPath.length} slot(s)
                    </Badge>
                  ) : (
                    <Badge variant="error" size="sm">
                      Not found — bucket {searchResult.bucketModule} empty or chain exhausted
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Dual-table visualization — the educational centerpiece */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bucket heads */}
            <div className="flex flex-col gap-2">
              <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
                Bucket heads — which bucket, which chain
              </Text>
              <Card padding="md">
                <BucketHeadsTable
                  bucketHeads={table.bucketHeads}
                  highlightModule={highlightModule}
                />
              </Card>
            </div>

            {/* Data array */}
            <div className="flex flex-col gap-2">
              <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">
                Data array — physical layout with cursor pointers
              </Text>
              <Card padding="md">
                <DataArrayTable
                  dataArray={table.dataArray}
                  nextAvailable={table.nextAvailable}
                  highlightPositions={highlightPositions}
                />
              </Card>
            </div>
          </div>

          {/* Table metadata */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="neutral" size="sm">Modulus: {table.modulus}</Badge>
            <Badge variant="neutral" size="sm">Capacity: {table.capacity}</Badge>
            <Badge variant="neutral" size="sm">
              Next free slot: {table.nextAvailable === 0 ? 'none (full)' : table.nextAvailable}
            </Badge>
            <Badge variant="neutral" size="sm">
              Occupied: {table.dataArray.filter(s => s.key !== 0).length}/{table.capacity}
            </Badge>
          </div>
        </>
      )}
    </div>
  )
}
