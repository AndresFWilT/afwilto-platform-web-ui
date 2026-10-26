import type { FeedbackMode } from '@/exams/domain'
import { ChoiceInput } from '../molecules/ChoiceInput'

/** When the taker sees the answers: at the end (exam mode) or after each question (review mode). */
export function FeedbackFields({ value, onChange }: { value: FeedbackMode; onChange: (value: FeedbackMode) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-neutral-100">Answers</legend>
      <div className="flex flex-wrap gap-4">
        <ChoiceInput type="radio" name="feedback" checked={value === 'end'} onChange={() => onChange('end')}>At the end</ChoiceInput>
        <ChoiceInput type="radio" name="feedback" checked={value === 'each'} onChange={() => onChange('each')}>After each question</ChoiceInput>
      </div>
    </fieldset>
  )
}
