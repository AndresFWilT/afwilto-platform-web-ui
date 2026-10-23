import { Button, Input } from '@afwilto/design-system'
import type { SessionForm } from '@/exams/domain'
import { ChoiceInput } from '../molecules/ChoiceInput'

interface Props {
  form: SessionForm
  /** The last suggestion of the preview; null before the first one. */
  suggestedMinutes: number | null
  onTiming: (timing: SessionForm['timing']) => void
  onMinutes: (value: string) => void
  onReset: () => void
}

/** Untimed or timed; the minutes come prefilled by the preview until the owner edits them. */
export function TimingFields({ form, suggestedMinutes, onTiming, onMinutes, onReset }: Props) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-neutral-100">Tiempo</legend>
      <div className="flex flex-wrap gap-4">
        <ChoiceInput type="radio" name="timing" checked={form.timing === 'untimed'} onChange={() => onTiming('untimed')}>Sin tiempo</ChoiceInput>
        <ChoiceInput type="radio" name="timing" checked={form.timing === 'timed'} onChange={() => onTiming('timed')}>Con tiempo</ChoiceInput>
      </div>
      {form.timing === 'timed' && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex max-w-xs flex-col gap-1">
            <label htmlFor="minutes" className="text-sm text-neutral-300">Minutos</label>
            <Input id="minutes" inputMode="numeric" value={form.minutes} onChange={(e) => onMinutes(e.target.value)} />
          </div>
          {form.minutesEdited && suggestedMinutes !== null && (
            <Button type="button" size="sm" variant="ghost" onClick={onReset}>restablecer sugerido</Button>
          )}
        </div>
      )}
    </fieldset>
  )
}
