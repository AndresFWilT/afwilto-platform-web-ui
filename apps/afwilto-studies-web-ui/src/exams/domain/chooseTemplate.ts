import type { QuestionTemplate, ViewQuestion } from './types'

/** FR-11: the template comes from the content alone. */
export function chooseTemplate(_question: Pick<ViewQuestion, 'stem' | 'options'>): QuestionTemplate {
  return 'text-list'
}
