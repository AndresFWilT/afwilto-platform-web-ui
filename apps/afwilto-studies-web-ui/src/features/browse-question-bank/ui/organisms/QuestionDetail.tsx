import { Button, Text } from '@afwilto/design-system'
import { toRevealInfo, toViewQuestion, type ExamQuestion } from '@/exams/domain'
import { QuestionView } from '@/shared/ui/organisms/QuestionView'

const NO_SELECTION: string[] = []
const noop = () => {}

interface Props {
  question: ExamQuestion
  resolveMediaUrl: (sha256: string) => string | null
  onDelete: () => void
  onClose: () => void
}

/** One stored question in reveal mode: answer key, rationales and explanation. */
export function QuestionDetail({ question, resolveMediaUrl, onDelete, onClose }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text variant="small" color="muted"><code>{question.key}</code> · version {question.version}</Text>
        <span className="flex gap-2">
          <Button size="sm" variant="danger" onClick={onDelete}>Delete question</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        </span>
      </div>
      <QuestionView question={toViewQuestion(question)} selected={NO_SELECTION} onToggle={noop} disabled reveal={toRevealInfo(question)} resolveMediaUrl={resolveMediaUrl} />
    </div>
  )
}
