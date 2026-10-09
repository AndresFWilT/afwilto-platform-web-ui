import { Link } from 'react-router-dom'
import { Badge } from '@afwilto/design-system'

export function ColorChip({ id, color }: { id: string; color: string }) {
  return (
    <span
      aria-hidden
      data-testid={`color-chip-${id}`}
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-surface-border"
      style={{ backgroundColor: color }}
    />
  )
}

export function KindBadge({ name }: { name: string }) {
  return (
    <Badge variant="neutral" size="sm">
      {name}
    </Badge>
  )
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      to={`/studies/tags/${encodeURIComponent(tag)}`}
      className="inline-flex items-center rounded-full border border-surface-border bg-brand-700 px-2.5 py-0.5 text-xs font-medium text-neutral-100 transition-colors hover:border-primary-400 hover:text-primary-300"
    >
      {tag}
    </Link>
  )
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t}>
          <TagChip tag={t} />
        </li>
      ))}
    </ul>
  )
}

const DATE_FORMAT = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function DateText({ iso }: { iso: string }) {
  return <time dateTime={iso}>{DATE_FORMAT.format(new Date(iso))}</time>
}
