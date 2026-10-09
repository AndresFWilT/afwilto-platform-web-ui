import { useSearchParams } from 'react-router-dom'
import { Select } from '@afwilto/design-system'
import type { NoteSort } from '@/application/ports'
import { SORT_OPTIONS, applySortToParams, sortFromParams, sortKey } from './sortOptions'

/** The current sort, kept in the URL query (AC-F4: survives a reload). */
export function useSortParam(): [NoteSort, (sort: NoteSort) => void] {
  const [params, setParams] = useSearchParams()
  const sort = sortFromParams(params)
  const setSort = (next: NoteSort) => setParams((current) => applySortToParams(current, next), { replace: true })
  return [sort, setSort]
}

export function SortSelect({ value, onChange }: { value: NoteSort; onChange: (sort: NoteSort) => void }) {
  return (
    <div className="w-52">
      <Select
        aria-label="Sort notes"
        selectSize="sm"
        value={sortKey(value)}
        onChange={(e) => {
          const option = SORT_OPTIONS.find((o) => sortKey(o.sort) === e.target.value)
          if (option) onChange(option.sort)
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={sortKey(o.sort)} value={sortKey(o.sort)}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
