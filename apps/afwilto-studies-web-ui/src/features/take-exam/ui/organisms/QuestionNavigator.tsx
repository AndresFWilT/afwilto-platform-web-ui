import type { AttemptItem } from '@/exams/domain'
import { NavigatorCell } from '../molecules/NavigatorCell'

interface Props {
  items: Array<Pick<AttemptItem, 'position' | 'answered' | 'flagged'>>
  current: number
  /** Positions with a save in flight. */
  saving: ReadonlySet<number>
  onSelect: (position: number) => void
}

/** A wrapping grid of numbered cells: blank, answered, flagged and both. */
export function QuestionNavigator({ items, current, saving, onSelect }: Props) {
  return (
    <nav aria-label="Question navigator" className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
      {items.map((item) => (
        <NavigatorCell key={item.position} item={item} current={item.position === current} saving={saving.has(item.position)} onSelect={onSelect} />
      ))}
    </nav>
  )
}
