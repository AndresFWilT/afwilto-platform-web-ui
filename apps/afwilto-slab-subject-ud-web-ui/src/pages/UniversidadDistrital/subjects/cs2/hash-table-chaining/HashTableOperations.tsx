import { useState } from 'react'
import { Text, Button, Input } from '@afwilto/design-system'
import type { HashEntry, HashTable } from '@/application/ports/IHashTableService'

interface HashTableOperationsProps {
  table: HashTable
  loading: boolean
  onInsert: (entry: HashEntry) => void
  onDelete: (key: number) => void
  onFind: (key: number) => void
}

export function HashTableOperations({ table, loading, onInsert, onDelete, onFind }: HashTableOperationsProps) {
  const [insertKey,   setInsertKey]   = useState('')
  const [insertLabel, setInsertLabel] = useState('')
  const [deleteKey,   setDeleteKey]   = useState('')
  const [findKey,     setFindKey]     = useState('')

  const busy = loading

  function submitInsert() {
    const key = parseInt(insertKey)
    if (isNaN(key) || key < 0 || !insertLabel.trim()) return
    onInsert({ key, label: insertLabel.trim() })
    setInsertKey('')
    setInsertLabel('')
  }

  function submitDelete() {
    const key = parseInt(deleteKey)
    if (isNaN(key)) return
    onDelete(key)
    setDeleteKey('')
  }

  function submitFind() {
    const key = parseInt(findKey)
    if (isNaN(key)) return
    onFind(key)
  }

  function onKey(e: React.KeyboardEvent, fn: () => void) {
    if (e.key === 'Enter') fn()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Insert */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Insert</Text>
        <div className="flex gap-2">
          <Input inputSize="sm" type="number" placeholder="key" value={insertKey}
            onChange={e => setInsertKey(e.target.value)}
            onKeyDown={e => onKey(e, submitInsert)}
            disabled={busy} className="w-20" />
          <Input inputSize="sm" placeholder="label" value={insertLabel}
            onChange={e => setInsertLabel(e.target.value)}
            onKeyDown={e => onKey(e, submitInsert)}
            disabled={busy} className="w-full" />
          <Button variant="primary" size="sm" onClick={submitInsert}
            disabled={busy || !insertKey || !insertLabel}>+</Button>
        </div>
        <Text variant="caption" color="muted">
          Bucket = {insertKey && !isNaN(parseInt(insertKey))
            ? `${parseInt(insertKey)} mod ${table.modulus} = ${parseInt(insertKey) % table.modulus}`
            : `key mod ${table.modulus}`}
        </Text>
      </div>

      {/* Delete */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Delete</Text>
        <div className="flex gap-2">
          <Input inputSize="sm" type="number" placeholder="key" value={deleteKey}
            onChange={e => setDeleteKey(e.target.value)}
            onKeyDown={e => onKey(e, submitDelete)}
            disabled={busy} className="w-full" />
          <Button variant="danger" size="sm" onClick={submitDelete}
            disabled={busy || !deleteKey}>−</Button>
        </div>
      </div>

      {/* Find */}
      <div className="flex flex-col gap-2">
        <Text variant="caption" color="muted" className="uppercase tracking-widest">Find</Text>
        <div className="flex gap-2">
          <Input inputSize="sm" type="number" placeholder="key" value={findKey}
            onChange={e => setFindKey(e.target.value)}
            onKeyDown={e => onKey(e, submitFind)}
            disabled={busy} className="w-full" />
          <Button variant="secondary" size="sm" onClick={submitFind}
            disabled={busy || !findKey}>?</Button>
        </div>
      </div>
    </div>
  )
}
