import { Badge, Text } from '@afwilto/design-system'
import { examPaceMinutes, type Classification, type ExamCategory, type ExamSummary } from '@/exams/domain'
import { countLabel, formatNumber } from '@/shared/lib/format'
import { WeightMark } from '../molecules/WeightMark'

function paceText(category: ExamCategory, exam: ExamSummary): string {
  if (category.paceQuestions !== null && category.paceMinutes !== null) return `${category.paceQuestions} preguntas / ${category.paceMinutes} min`
  return `${formatNumber(examPaceMinutes(exam))} min por pregunta (del examen)`
}

/** One classification with its categories: counts, weight (primary only) and pace. */
export function ClassificationSection({ classification, exam }: { classification: Classification; exam: ExamSummary }) {
  const primary = classification.position === 0
  return (
    <section aria-label={classification.name} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Text variant="h3" color="default">{classification.name}</Text>
        {primary && <Badge size="sm" variant="success">Principal</Badge>}
      </div>
      <ul className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border">
        {classification.categories.map((category) => (
          <li key={category.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span className="font-medium text-neutral-100">{category.name}</span>
            <span className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
              <span>{countLabel(category.questionCount, 'pregunta', 'preguntas')}</span>
              {primary && category.weightPercent !== null && (
                <span className="flex items-center gap-1">
                  <span>{category.weightPercent} %</span>
                  <WeightMark mode={classification.weightMode} />
                </span>
              )}
              <span className="text-xs text-neutral-400">{paceText(category, exam)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
