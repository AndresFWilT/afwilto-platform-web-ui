import { useState } from 'react'
import { Button, Text, FormField } from '@afwilto/design-system'
import type { DateRange } from './types'

interface Props {
  range: DateRange
  loading: boolean
  onLoad: (range: DateRange) => void
}

export function DateRangePicker({ range, loading, onLoad }: Props) {
  const [from, setFrom]     = useState(toDatetimeLocal(range.from))
  const [to, setTo]         = useState(toDatetimeLocal(range.to))
  const [error, setError]   = useState<string | null>(null)

  function handleLoad() {
    const fromDate = new Date(from)
    const toDate   = new Date(to)
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      setError('Both dates must be valid.')
      return
    }
    if (fromDate >= toDate) {
      setError("'From' must be before 'to'.")
      return
    }
    setError(null)
    onLoad({ from: fromDate.toISOString(), to: toDate.toISOString() })
  }

  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" weight="medium" color="muted">Date Range</Text>
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <FormField
          label="From"
          id="range-from"
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          inputSize="sm"
          className="flex-1"
        />
        <FormField
          label="To"
          id="range-to"
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          inputSize="sm"
          className="flex-1"
        />
        <Button variant="primary" size="sm" loading={loading} onClick={handleLoad}>
          Load
        </Button>
      </div>
      {error && (
        <Text variant="caption" color="error">{error}</Text>
      )}
    </div>
  )
}

function toDatetimeLocal(isoString: string): string {
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
