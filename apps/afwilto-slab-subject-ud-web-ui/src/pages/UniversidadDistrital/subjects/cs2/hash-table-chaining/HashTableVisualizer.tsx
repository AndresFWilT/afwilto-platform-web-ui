import clsx from 'clsx'
import type { HashBucket, HashOperation, HashTable } from '@/application/ports/IHashTableService'

interface HashTableVisualizerProps {
  table: HashTable
  lastOp: HashOperation | null
}

export function HashTableVisualizer({ table, lastOp }: HashTableVisualizerProps) {
  // Expand sparse buckets to a dense array for display
  const dense: HashBucket[] = Array.from({ length: table.modulus }, (_, i) => ({
    bucketIndex: i,
    chain: [],
  }))
  for (const b of table.buckets) {
    dense[b.bucketIndex] = b
  }

  return (
    <div
      className="rounded-lg border border-surface-border overflow-auto"
      style={{ backgroundColor: 'var(--color-brand-50)', maxHeight: '480px', scrollbarWidth: 'thin' }}
    >
      <div className="p-4 flex flex-col gap-1.5">
        {dense.map(bucket => (
          <BucketRow key={bucket.bucketIndex} bucket={bucket} lastOp={lastOp} />
        ))}
      </div>
    </div>
  )
}

interface BucketRowProps {
  bucket: HashBucket
  lastOp: HashOperation | null
}

function BucketRow({ bucket, lastOp }: BucketRowProps) {
  const len = bucket.chain.length
  const isTouchedBucket = lastOp?.location.bucketIndex === bucket.bucketIndex

  const bucketColor =
    len === 0 ? 'empty'
    : len === 1 ? 'ok'
    : len === 2 ? 'warn'
    : 'bad'

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Bucket index label */}
      <span className="w-14 shrink-0 text-right font-mono text-xs text-brand-500 select-none">
        b[{bucket.bucketIndex}]
      </span>

      {/* Bucket divider */}
      <div className={clsx(
        'w-px h-5 shrink-0',
        bucketColor === 'empty' ? 'bg-surface-border' : 'bg-brand-400'
      )} />

      {/* Chain */}
      {len === 0 ? (
        <div className="flex items-center justify-center h-7 w-12 border border-dashed rounded border-surface-border">
          <span className="text-xs text-brand-400 font-mono">—</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-wrap">
          {bucket.chain.map((entry, ci) => {
            const isHighlighted =
              isTouchedBucket && lastOp?.location.chainIndex === ci

            return (
              <span key={entry.key} className="flex items-center gap-1">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 h-7 px-2 rounded border font-mono text-xs transition-all duration-300',
                    bucketColor === 'ok'   && 'border-success-400/50 text-success-300',
                    bucketColor === 'warn' && 'border-warning-400/50 text-warning-300',
                    bucketColor === 'bad'  && 'border-error-400/50 text-error-300',
                    isHighlighted && 'ring-2 ring-offset-1',
                    isHighlighted && lastOp?.type === 'INSERT' && 'ring-success-400',
                    isHighlighted && lastOp?.type === 'DELETE' && 'ring-error-400',
                    isHighlighted && lastOp?.type === 'FIND'   && 'ring-primary-400',
                  )}
                  style={{
                    backgroundColor:
                      bucketColor === 'ok'   ? 'rgba(34,197,94,0.15)'
                      : bucketColor === 'warn' ? 'rgba(245,158,11,0.15)'
                      : 'rgba(239,68,68,0.15)',
                    ...(isHighlighted ? { outlineOffset: '2px' } : {}),
                  }}
                >
                  <span className="text-brand-800 font-bold">{entry.key}</span>
                  <span className="text-brand-500">/</span>
                  <span className="text-brand-600">{entry.label}</span>
                </span>
                {ci < len - 1 && (
                  <span className="text-brand-400 text-xs select-none">→</span>
                )}
              </span>
            )
          })}
          <span className="text-brand-400 text-xs select-none ml-1">→ ∅</span>
        </div>
      )}
    </div>
  )
}

