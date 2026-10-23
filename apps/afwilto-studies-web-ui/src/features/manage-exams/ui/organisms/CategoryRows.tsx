import { Input, Text } from '@afwilto/design-system'
import type { Classification, ExamDraft } from '@/exams/domain'

interface Props {
  classification: Classification
  draft: ExamDraft
  problems: Record<string, string>
  onChange: (categoryId: string, field: 'name' | 'paceQuestions' | 'paceMinutes', value: string) => void
}

/** Rename and pace of every category of one classification. Labels name the stored category. */
export function CategoryRows({ classification, draft, problems, onChange }: Props) {
  return (
    <ul className="flex flex-col divide-y divide-surface-border rounded-lg border border-surface-border" aria-label={`Categorías de ${classification.name}`}>
      {classification.categories.map((c) => {
        const d = draft.categories[c.id]
        if (!d) return null
        const error = problems[`category:${c.id}`] ?? problems[`pace:${c.id}`]
        return (
          <li key={c.id} className="flex flex-col gap-1 px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-48 grow basis-56">
                <Input inputSize="sm" aria-label={`Nombre de «${c.name}»`} value={d.name} error={Boolean(problems[`category:${c.id}`])} onChange={(e) => onChange(c.id, 'name', e.target.value)} />
              </div>
              <div className="w-28">
                <Input inputSize="sm" type="number" min={1} step={1} placeholder="Preguntas" aria-label={`Ritmo: preguntas de «${c.name}»`} value={d.paceQuestions} error={Boolean(problems[`pace:${c.id}`])} onChange={(e) => onChange(c.id, 'paceQuestions', e.target.value)} />
              </div>
              <div className="w-28">
                <Input inputSize="sm" type="number" min={1} step={1} placeholder="Minutos" aria-label={`Ritmo: minutos de «${c.name}»`} value={d.paceMinutes} error={Boolean(problems[`pace:${c.id}`])} onChange={(e) => onChange(c.id, 'paceMinutes', e.target.value)} />
              </div>
            </div>
            {error && <Text variant="caption" color="error" role="alert">{error}</Text>}
          </li>
        )
      })}
    </ul>
  )
}
