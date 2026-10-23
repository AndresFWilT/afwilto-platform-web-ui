import { hasMediaImage } from './mediaStem'
import type { QuestionTemplate, ViewQuestion } from './types'

/**
 * FR-11: the template comes from the content alone. Option images win; a stem
 * image counts only when it is a `media:` reference (an https image is plain Markdown).
 */
export function chooseTemplate(question: Pick<ViewQuestion, 'stem' | 'options'>): QuestionTemplate {
  if (question.options.some((o) => o.image)) return 'option-cards'
  if (hasMediaImage(question.stem)) return 'media-stem'
  return 'text-list'
}
