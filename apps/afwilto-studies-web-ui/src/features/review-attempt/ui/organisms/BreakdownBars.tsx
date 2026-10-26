import { Text } from '@afwilto/design-system'
import type { ClassificationScore } from '@/exams/domain'
import { BreakdownBar } from '../molecules/BreakdownBar'

/** One bar list per classification, weakest category first. */
export function BreakdownBars({ breakdown }: { breakdown: ClassificationScore[] }) {
  if (breakdown.length === 0) return null
  return (
    <div className="flex flex-col gap-4">
      {breakdown.map((c) => (
        <section key={c.classification} aria-label={`Breakdown by ${c.classification}`} className="flex flex-col gap-2">
          <Text variant="h3" color="default">{c.classification}</Text>
          <ul className="flex flex-col gap-2">
            {c.categories.map((category) => (
              <BreakdownBar key={category.name} {...category} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
