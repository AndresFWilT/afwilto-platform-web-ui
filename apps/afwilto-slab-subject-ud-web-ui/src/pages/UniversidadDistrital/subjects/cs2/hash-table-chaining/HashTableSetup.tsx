import { useState } from 'react'
import { Text, Button, Input, Alert } from '@afwilto/design-system'
import type { HashEntry, HashTable } from '@/application/ports/IHashTableService'
import { isPrime } from './prime-validator'
import { randomEntries } from './random-generator'

interface HashTableSetupProps {
  onInitialize: (table: HashTable) => void
  hasTable: boolean
}

export function HashTableSetup({ onInitialize, hasTable }: HashTableSetupProps) {
  const [modulus, setModulus]     = useState('')
  const [keysRaw, setKeysRaw]     = useState('')
  const [labelsRaw, setLabelsRaw] = useState('')
  const [randCount, setRandCount] = useState('5')
  const [localError, setLocalError] = useState<string | null>(null)

  const modulusNum = parseInt(modulus)
  const modulusValid = !isNaN(modulusNum) && isPrime(modulusNum)

  function buildTable(entries: HashEntry[]): HashTable {
    const bucketMap = new Map<number, HashEntry[]>()
    const seen = new Set<number>()
    for (const e of entries) {
      if (seen.has(e.key)) throw new Error(`Duplicate key: ${e.key}`)
      seen.add(e.key)
      const idx = e.key % modulusNum
      if (!bucketMap.has(idx)) bucketMap.set(idx, [])
      bucketMap.get(idx)!.push(e)
    }
    return {
      modulus: modulusNum,
      buckets: Array.from(bucketMap.entries()).map(([bucketIndex, chain]) => ({ bucketIndex, chain })),
    }
  }

  function handleManual() {
    setLocalError(null)
    if (!modulusValid) { setLocalError('Modulus must be a prime number.'); return }
    const keys = keysRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    const labels = labelsRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (keys.length === 0) { setLocalError('Enter at least one key.'); return }
    if (keys.length !== labels.length) { setLocalError('Keys and labels must have the same count.'); return }
    const entries: HashEntry[] = keys.map((key, i) => ({ key, label: labels[i] }))
    try {
      onInitialize(buildTable(entries))
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Invalid input')
    }
  }

  function handleRandom() {
    setLocalError(null)
    if (!modulusValid) { setLocalError('Modulus must be a prime number.'); return }
    const count = parseInt(randCount)
    if (isNaN(count) || count < 1 || count > 50) { setLocalError('Random count must be 1–50.'); return }
    try {
      const entries = randomEntries(count)
      setKeysRaw(entries.map(e => e.key).join(', '))
      setLabelsRaw(entries.map(e => e.label).join(', '))
      onInitialize(buildTable(entries))
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Generation failed')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text variant="h4" color="default">Setup</Text>
        {hasTable && (
          <Text variant="caption" color="muted">
            Edit below and reinitialize to reset the table
          </Text>
        )}
      </div>

      {localError && (
        <Alert variant="error" onClose={() => setLocalError(null)}>{localError}</Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Modulus */}
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">
            Modulus (prime m)
          </Text>
          <Input
            inputSize="sm"
            type="number"
            placeholder="e.g. 7"
            value={modulus}
            onChange={e => setModulus(e.target.value)}
            error={modulus !== '' && !modulusValid}
          />
          {modulus !== '' && (
            <Text variant="caption" color={modulusValid ? 'success' : 'error'}>
              {modulusValid ? `✓ ${modulusNum} is prime` : `✕ not prime`}
            </Text>
          )}
        </div>

        {/* Keys */}
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">
            Keys (comma-separated)
          </Text>
          <Input inputSize="sm" placeholder="14, 21, 9, 16" value={keysRaw} onChange={e => setKeysRaw(e.target.value)} />
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">
            Labels (comma-separated)
          </Text>
          <Input inputSize="sm" placeholder="ab, cd, ef, gh" value={labelsRaw} onChange={e => setLabelsRaw(e.target.value)} />
        </div>

        {/* Random count */}
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">
            Random count
          </Text>
          <div className="flex gap-2">
            <Input
              inputSize="sm"
              type="number"
              placeholder="5"
              value={randCount}
              onChange={e => setRandCount(e.target.value)}
              className="w-16"
            />
            <Button variant="ghost" size="sm" onClick={handleRandom} disabled={!modulusValid}>
              Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="primary" size="sm" onClick={handleManual} disabled={!modulusValid}>
          Initialize Table
        </Button>
      </div>
    </div>
  )
}
