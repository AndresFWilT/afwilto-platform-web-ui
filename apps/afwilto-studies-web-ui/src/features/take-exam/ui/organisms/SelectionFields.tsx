import { Input, Select, Text } from '@afwilto/design-system'
import type { Exam, SessionForm } from '@/exams/domain'
import { ChoiceInput } from '../molecules/ChoiceInput'

interface Props {
  exam: Exam
  form: SessionForm
  /** The distinct `origin.set` values of the bank. */
  sets: string[]
  onChange: (changes: Partial<SessionForm>) => void
}

/** Which questions: random N, by categories (one classification) or one original set. */
export function SelectionFields({ exam, form, sets, onChange }: Props) {
  const classification = exam.classifications.find((c) => c.id === form.classificationId)
  const toggleCategory = (id: string) =>
    onChange({ categoryIds: form.categoryIds.includes(id) ? form.categoryIds.filter((c) => c !== id) : [...form.categoryIds, id] })

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-neutral-100">Selection</legend>
      <div className="flex flex-wrap gap-4">
        <ChoiceInput type="radio" name="selection" checked={form.selectionKind === 'random'} onChange={() => onChange({ selectionKind: 'random' })}>Random</ChoiceInput>
        <ChoiceInput type="radio" name="selection" checked={form.selectionKind === 'categories'} onChange={() => onChange({ selectionKind: 'categories' })}>By category</ChoiceInput>
        <ChoiceInput type="radio" name="selection" checked={form.selectionKind === 'origin-set'} onChange={() => onChange({ selectionKind: 'origin-set' })}>Original set</ChoiceInput>
      </div>

      {form.selectionKind === 'random' && (
        <div className="flex max-w-xs flex-col gap-1">
          <label htmlFor="random-count" className="text-sm text-neutral-300">Number of questions</label>
          <Input id="random-count" inputMode="numeric" value={form.randomCount} onChange={(e) => onChange({ randomCount: e.target.value })} />
        </div>
      )}

      {form.selectionKind === 'categories' && (
        <div className="flex flex-col gap-3">
          <div className="flex max-w-xs flex-col gap-1">
            <label htmlFor="classification" className="text-sm text-neutral-300">Classification</label>
            <Select id="classification" value={form.classificationId} onChange={(e) => onChange({ classificationId: e.target.value, categoryIds: [] })}>
              {exam.classifications.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2" role="group" aria-label="Categories">
            {(classification?.categories ?? []).map((c) => (
              <ChoiceInput key={c.id} type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)}>
                {`${c.name} (${c.questionCount})`}
              </ChoiceInput>
            ))}
            {classification?.categories.length === 0 && <Text variant="small" color="muted">This classification has no categories.</Text>}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <ChoiceInput type="radio" name="category-scope" checked={form.categoryScope === 'all'} onChange={() => onChange({ categoryScope: 'all' })}>All</ChoiceInput>
            <ChoiceInput type="radio" name="category-scope" checked={form.categoryScope === 'count'} onChange={() => onChange({ categoryScope: 'count' })}>Count</ChoiceInput>
            {form.categoryScope === 'count' && (
              <div className="flex max-w-xs flex-col gap-1">
                <label htmlFor="category-count" className="text-sm text-neutral-300">Number of questions</label>
                <Input id="category-count" inputMode="numeric" value={form.categoryCount} onChange={(e) => onChange({ categoryCount: e.target.value })} />
              </div>
            )}
          </div>
        </div>
      )}

      {form.selectionKind === 'origin-set' && (
        <div className="flex max-w-xs flex-col gap-1">
          <label htmlFor="origin-set" className="text-sm text-neutral-300">Set</label>
          <Select id="origin-set" value={form.set} onChange={(e) => onChange({ set: e.target.value })}>
            <option value=""></option>
            {sets.map((set) => (
              <option key={set} value={set}>{set}</option>
            ))}
          </Select>
          {sets.length === 0 && <Text variant="caption" color="muted">No question in the bank declares an original set.</Text>}
        </div>
      )}
    </fieldset>
  )
}
