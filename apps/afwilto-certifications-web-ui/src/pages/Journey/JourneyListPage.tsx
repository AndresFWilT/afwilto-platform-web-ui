import { Link, useNavigate } from 'react-router-dom'
import {
  Alert,
  Button,
  EmptyState,
  Input,
  Pagination,
  Select,
  Skeleton,
  Table,
  Text,
} from '@afwilto/design-system'
import type { TableColumn, TableSort } from '@afwilto/design-system'
import { useCertificationList } from '@/hooks/useCertificationList'
import { useTimelineData } from '@/hooks/useTimelineData'
import { TimelineCanvas } from '@/pages/Timeline/TimelineCanvas'
import { StatusBadge } from '@/pages/shared/StatusBadge'
import type { Certification, CertificationStatus } from '@/application/ports'

const STATUS_OPTIONS: { value: CertificationStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'expired', label: 'Expired' },
  { value: 'abandoned', label: 'Abandoned' },
]

const SORT_OPTIONS = [
  { value: 'createdAt:asc', label: 'Newest first' },
  { value: 'name:asc', label: 'Name A→Z' },
  { value: 'name:desc', label: 'Name Z→A' },
  { value: 'achievedDate:desc', label: 'Achieved (newest)' },
  { value: 'expectedExamDate:asc', label: 'Exam date (soonest)' },
]

const COLUMNS: TableColumn<Certification>[] = [
  { key: 'name', header: 'Name', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'category',
    header: 'Category',
    render: (row) => (
      <span className="inline-flex items-center gap-1.5">
        {row.category && (
          <span
            aria-hidden
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ backgroundColor: row.category.color }}
          />
        )}
        <Text as="span" variant="small" color="muted">
          {row.category?.path ?? '—'}
        </Text>
      </span>
    ),
  },
  {
    key: 'expectedExamDate',
    header: 'Expected',
    render: (row) => (
      <Text as="span" variant="small" color="muted">
        {row.expectedExamDate ?? '—'}
      </Text>
    ),
  },
  {
    key: 'achievedDate',
    header: 'Achieved',
    render: (row) => (
      <Text as="span" variant="small" color="muted">
        {row.achievedDate ?? '—'}
      </Text>
    ),
  },
]

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function JourneyListPage() {
  const navigate = useNavigate()
  const { items, meta, loading, error, query, setQuery } = useCertificationList()

  const currentYear = new Date().getFullYear()
  const { laned: timelineLaned } = useTimelineData(currentYear)

  const sortValue = query.sortBy && query.sortOrder
    ? `${query.sortBy}:${query.sortOrder}`
    : 'createdAt:asc'

  const tableSort: TableSort | undefined = query.sortBy
    ? { key: query.sortBy, order: query.sortOrder ?? 'asc' }
    : undefined

  function onSortChange(sort: TableSort) {
    setQuery({ ...query, sortBy: sort.key as typeof query.sortBy, sortOrder: sort.order, page: 1 })
  }

  function onSortSelectChange(value: string) {
    const [sortBy, sortOrder] = value.split(':') as [typeof query.sortBy, 'asc' | 'desc']
    setQuery({ ...query, sortBy, sortOrder, page: 1 })
  }

  return (
    <div className="mx-auto max-w-6xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Text as="h1" variant="h2">
          Certifications
        </Text>
        <Button size="sm" variant="primary" onClick={() => navigate('new')}>
          + New
        </Button>
      </div>

      {/* Front-page timeline overview (current year) */}
      {timelineLaned.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Text as="h2" variant="h4" color="muted">
              {currentYear} at a glance
            </Text>
            <Link
              to="/certifications/timeline"
              className="text-primary-400 text-sm font-medium hover:text-primary-300 transition-colors"
            >
              Full timeline →
            </Link>
          </div>
          <TimelineCanvas year={currentYear} laned={timelineLaned} />
        </div>
      )}

      {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            aria-label="Search certifications"
            placeholder="Search…"
            value={query.search ?? ''}
            onChange={e => setQuery({ ...query, search: e.target.value || undefined, page: 1 })}
            inputSize="sm"
            className="sm:w-64"
          />
          <Select
            aria-label="Filter by status"
            value={query.status ?? ''}
            onChange={e => {
              const v = e.target.value as CertificationStatus | ''
              setQuery({ ...query, status: v || undefined, page: 1 })
            }}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Input
            aria-label="Filter by year"
            type="number"
            placeholder="Year…"
            value={query.year ?? ''}
            onChange={e => setQuery({ ...query, year: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
            inputSize="sm"
            className="sm:w-28"
          />
          <Select
            aria-label="Sort order"
            value={sortValue}
            onChange={e => onSortSelectChange(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>

        {/* Content */}
        {error && (
          <Alert variant="error" title="Failed to load certifications">
            {error.message}
          </Alert>
        )}

        {loading && !error && <SkeletonRows />}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="🎓"
            title="No certifications yet"
            description="Start tracking your learning journey."
            action={
              <Button variant="primary" onClick={() => navigate('new')}>
                Add your first certification
              </Button>
            }
          />
        )}

        {!loading && !error && items.length > 0 && (
          <Table
            columns={COLUMNS}
            rows={items}
            rowKey={r => r.id}
            sort={tableSort}
            onSortChange={onSortChange}
            onRowClick={row => navigate(row.id)}
            label="Certifications list"
          />
        )}

      {meta && meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          onPageChange={page => setQuery({ ...query, page })}
        />
      )}

    </div>
  )
}
