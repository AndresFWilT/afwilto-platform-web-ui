import type { ReactNode } from 'react'

export type TableSortOrder = 'asc' | 'desc'

export interface TableColumn<Row> {
  key: string
  header: string
  sortable?: boolean
  /** Custom cell renderer; defaults to String(row[key]). */
  render?: (row: Row) => ReactNode
  /** Hide this column in the stacked mobile card view. */
  hideOnMobile?: boolean
}

export interface TableSort {
  key: string
  order: TableSortOrder
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  sort?: TableSort
  onSortChange?: (sort: TableSort) => void
  onRowClick?: (row: Row) => void
  /** Accessible table description. */
  label?: string
}
