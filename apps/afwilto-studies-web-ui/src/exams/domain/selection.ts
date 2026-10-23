import type { ViewQuestion } from './types'

/** The selection after the taker toggles `label`; unchanged when the toggle is not allowed. */
export function toggleSelection(
  _question: Pick<ViewQuestion, 'type' | 'chooseCount' | 'options'>,
  selected: string[],
  _label: string
): string[] {
  return selected
}
