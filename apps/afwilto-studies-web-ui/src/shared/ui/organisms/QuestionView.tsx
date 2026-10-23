import type { RevealInfo, ViewQuestion } from '@/exams/domain'

export interface QuestionViewProps {
  question: ViewQuestion
  selected: string[]
  onToggle: (label: string) => void
  disabled?: boolean
  reveal?: RevealInfo
  /** Keep this function's identity stable: the Markdown pipeline re-runs when it changes. */
  resolveMediaUrl: (sha256: string) => string | null
}

export function QuestionView(_props: QuestionViewProps) {
  return null
}
