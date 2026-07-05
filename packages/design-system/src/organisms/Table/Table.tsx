import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Card } from '../../molecules/Card'
import { Text } from '../../atoms/Text'
import type { TableColumn, TableProps, TableSort } from './Table.types'

function cellContent<Row>(column: TableColumn<Row>, row: Row): ReactNode {
  if (column.render) return column.render(row)
  const value = (row as Record<string, unknown>)[column.key]
  return value == null ? '—' : String(value)
}

function nextSort(current: TableSort | undefined, key: string): TableSort {
  if (current?.key === key && current.order === 'asc') return { key, order: 'desc' }
  return { key, order: 'asc' }
}

export function Table<Row>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  onRowClick,
  label,
}: TableProps<Row>) {
  return (
    <>
      {/* Desktop: semantic table */}
      <div className="hidden sm:block overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        <table aria-label={label} className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-surface-border">
              {columns.map((column) => {
                const isSorted = sort?.key === column.key
                const ariaSort = isSorted ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className="px-4 py-3 text-sm font-medium text-neutral-400"
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(nextSort(sort, column.key))}
                        className="inline-flex items-center gap-1 hover:text-neutral-100 transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
                      >
                        {column.header}
                        <span aria-hidden className="text-xs">
                          {isSorted ? (sort.order === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'border-b border-surface-border/60 text-sm text-neutral-100',
                  onRowClick && 'cursor-pointer hover:bg-brand-800 transition-colors duration-150 ease-in-out'
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-middle">
                    {cellContent(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <Card
            key={rowKey(row)}
            padding="sm"
            border
            className={clsx(onRowClick && 'cursor-pointer')}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <dl className="flex flex-col gap-1.5">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex items-baseline justify-between gap-3">
                    <dt>
                      <Text variant="caption" color="muted">
                        {column.header}
                      </Text>
                    </dt>
                    <dd className="text-sm text-neutral-100 text-right">{cellContent(column, row)}</dd>
                  </div>
                ))}
            </dl>
          </Card>
        ))}
      </div>
    </>
  )
}
