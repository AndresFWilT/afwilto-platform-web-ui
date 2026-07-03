import { Text, Button } from '@afwilto/design-system'
import type { HashEntry } from '@/application/ports/IHashDispersionService'

interface EntryInputProps {
  modulus: number
  entries: HashEntry[]
  onModulusChange: (m: number) => void
  onEntriesChange: (entries: HashEntry[]) => void
  onGenerateRandom: () => void
  onDisperse: () => void
  loading: boolean
}

export function EntryInput({
  modulus, entries, onModulusChange, onEntriesChange, onGenerateRandom, onDisperse, loading
}: EntryInputProps) {

  function addRow() {
    onEntriesChange([...entries, { key: 0, value: '' }])
  }

  function removeRow(i: number) {
    onEntriesChange(entries.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: 'key' | 'value', raw: string) {
    const updated = entries.map((e, idx) => {
      if (idx !== i) return e
      if (field === 'key') {
        const v = parseInt(raw, 10)
        return { ...e, key: isNaN(v) ? 0 : Math.max(0, v) }
      }
      return { ...e, value: raw }
    })
    onEntriesChange(updated)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Modulus row */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" color="muted" className="uppercase tracking-widest">Prime modulus</Text>
          <input
            type="number"
            min={2}
            value={modulus === 0 ? '' : modulus}
            placeholder="e.g. 7"
            onChange={e => onModulusChange(parseInt(e.target.value, 10) || 0)}
            className="h-9 w-24 rounded border border-surface-border bg-brand-800 px-3 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={onGenerateRandom} disabled={loading || modulus < 2}>
            Random (6 keys)
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onDisperse}
            disabled={loading || entries.length === 0 || modulus < 2}
            loading={loading}
          >
            Disperse
          </Button>
        </div>
      </div>

      {/* Key-value table */}
      {entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">Key</Text>
                </th>
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">Value</Text>
                </th>
                <th className="py-2 pl-3 text-left">
                  <Text variant="caption" color="muted" className="uppercase tracking-widest">Bucket (h=k%m)</Text>
                </th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-surface-border last:border-0">
                  <td className="py-1.5 pl-3">
                    <input
                      type="number"
                      min={0}
                      value={e.key}
                      onChange={ev => updateRow(i, 'key', ev.target.value)}
                      className="h-8 w-20 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-3">
                    <input
                      type="text"
                      value={e.value}
                      onChange={ev => updateRow(i, 'value', ev.target.value)}
                      placeholder="name"
                      className="h-8 w-24 rounded border border-surface-border bg-brand-800 px-2 text-sm text-neutral-100 focus:border-primary-400 focus:outline-none"
                    />
                  </td>
                  <td className="py-1.5 pl-3">
                    <Text variant="small" color="muted" className="font-mono">
                      {modulus > 0 ? e.key % modulus : '—'}
                    </Text>
                  </td>
                  <td className="py-1.5 pl-3">
                    <button
                      onClick={() => removeRow(i)}
                      className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button variant="secondary" size="sm" onClick={addRow} disabled={loading}>
        + Add Entry
      </Button>
    </div>
  )
}
