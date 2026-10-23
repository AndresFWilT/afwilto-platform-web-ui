import type { ViewQuestion } from './types'

/** The selection after the taker toggles `label`; unchanged when the toggle is not allowed. */
export function toggleSelection(
  question: Pick<ViewQuestion, 'type' | 'chooseCount' | 'options'>,
  selected: string[],
  label: string
): string[] {
  if (!question.options.some((o) => o.label === label)) return selected
  if (question.type === 'single') return [label]
  if (selected.includes(label)) return selected.filter((l) => l !== label)
  if (selected.length >= question.chooseCount) return selected
  const next = new Set([...selected, label])
  return question.options.map((o) => o.label).filter((l) => next.has(l))
}
