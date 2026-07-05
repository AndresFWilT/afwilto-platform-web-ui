import { Button } from '../../atoms/Button'
import { Text } from '../../atoms/Text'
import type { PaginationProps } from './Pagination.types'

function pageWindow(page: number, totalPages: number): number[] {
  const size = 5
  let start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + size - 1)
  start = Math.max(1, end - size + 1)
  const pages: number[] = []
  for (let p = start; p <= end; p++) pages.push(p)
  return pages
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 0) return null

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <Text variant="caption" color="muted">
        Page {page} of {totalPages} · {totalItems} item{totalItems === 1 ? '' : 's'}
      </Text>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </Button>
        {pageWindow(page, totalPages).map((p) => (
          <Button
            key={p}
            variant={p === page ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </Button>
      </div>
    </nav>
  )
}
