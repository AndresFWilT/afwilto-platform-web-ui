import { Button, Text } from '@afwilto/design-system'
import { filterReview, type ReviewFilter, type ReviewItem } from '@/exams/domain'
import { ReviewEntry } from './ReviewEntry'

const FILTERS: Array<{ value: ReviewFilter; label: string; empty: string }> = [
  { value: 'incorrect', label: 'Incorrect', empty: 'No incorrect questions.' },
  { value: 'flagged', label: 'Flagged', empty: 'No flagged questions.' },
  { value: 'all', label: 'All', empty: 'No questions.' },
]

interface Props {
  review: ReviewItem[]
  filter: ReviewFilter
  onFilter: (filter: ReviewFilter) => void
  resolveMediaUrl: (sha256: string) => string | null
}

/** Every question with its answer key, filtered to the ones worth studying. */
export function ReviewList({ review, filter, onFilter, resolveMediaUrl }: Props) {
  const shown = filterReview(review, filter)
  return (
    <section aria-label="Review" className="flex flex-col gap-3">
      <Text variant="h2" color="default">Review</Text>
      <div role="group" aria-label="Filter questions" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <Button key={value} size="sm" variant={filter === value ? 'primary' : 'ghost'} aria-pressed={filter === value} onClick={() => onFilter(value)}>
            {label}
          </Button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Text variant="body" color="muted">{FILTERS.find((f) => f.value === filter)!.empty}</Text>
      ) : (
        shown.map((item) => <ReviewEntry key={item.position} item={item} resolveMediaUrl={resolveMediaUrl} />)
      )}
    </section>
  )
}
