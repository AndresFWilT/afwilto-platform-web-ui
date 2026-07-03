import { Text } from '@afwilto/design-system'
import type { HashTable } from '@/application/ports/IHashTableService'

interface HashTableSummaryProps {
  table: HashTable
}

export function HashTableSummary({ table }: HashTableSummaryProps) {
  const totalEntries = table.buckets.reduce((s, b) => s + b.chain.length, 0)
  const loadFactor   = totalEntries / table.modulus
  const longestChain = table.buckets.reduce((m, b) => Math.max(m, b.chain.length), 0)
  const emptyBuckets = table.modulus - table.buckets.filter(b => b.chain.length > 0).length

  return (
    <div className="flex flex-wrap gap-6 px-1">
      <Stat label="Modulus (m)" value={String(table.modulus)} />
      <Stat label="Entries (n)" value={String(totalEntries)} />
      <Stat label="Load factor (n/m)" value={loadFactor.toFixed(2)}
        color={loadFactor > 1 ? 'error' : loadFactor > 0.7 ? 'warning' : 'success'} />
      <Stat label="Longest chain" value={String(longestChain)}
        color={longestChain >= 3 ? 'error' : longestChain === 2 ? 'warning' : 'success'} />
      <Stat label="Empty buckets" value={`${emptyBuckets} / ${table.modulus}`} />
    </div>
  )
}

type StatColor = 'default' | 'success' | 'warning' | 'error'

function Stat({ label, value, color = 'default' }: { label: string; value: string; color?: StatColor }) {
  const valueColor =
    color === 'success' ? 'text-success-400'
    : color === 'warning' ? 'text-warning-400'
    : color === 'error'   ? 'text-error-400'
    : 'text-primary-400'

  return (
    <div className="flex flex-col gap-0.5">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <span className={`text-xl font-bold font-mono ${valueColor}`}>{value}</span>
    </div>
  )
}
