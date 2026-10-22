import type { ReactNode } from 'react'
import { Card, Text } from '@afwilto/design-system'
import { ResultField } from '@/shared/ui/molecules/ResultField'

export interface ResultEntry {
  label: string
  value: string
}

/** The "Result" region: labelled values, plus optional extra content below. */
export function ResultPanel({ entries, children }: { entries: ResultEntry[]; children?: ReactNode }) {
  return (
    <section aria-label="Result">
      <Card padding="md" border className="flex flex-col gap-4">
        <Text variant="h4" color="default">
          Result
        </Text>
        <dl className="grid grid-cols-[minmax(7rem,max-content)_1fr] gap-x-6 gap-y-3">
          {entries.map((entry) => (
            <ResultField key={entry.label} label={entry.label} value={entry.value} />
          ))}
        </dl>
        {children}
      </Card>
    </section>
  )
}
