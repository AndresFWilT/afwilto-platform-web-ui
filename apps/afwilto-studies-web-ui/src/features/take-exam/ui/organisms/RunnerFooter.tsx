import { Button } from '@afwilto/design-system'

interface Props {
  hasPrevious: boolean
  hasNext: boolean
  flagged: boolean
  submitting: boolean
  onPrevious: () => void
  onNext: () => void
  onFlag: () => void
  onSubmit: () => void
}

export function RunnerFooter({ hasPrevious, hasNext, flagged, submitting, onPrevious, onNext, onFlag, onSubmit }: Props) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onPrevious} disabled={!hasPrevious}>Previous</Button>
        <Button variant="secondary" onClick={onNext} disabled={!hasNext}>Next</Button>
        <Button variant={flagged ? 'info' : 'ghost'} aria-pressed={flagged} onClick={onFlag} disabled={submitting}>Flag for review</Button>
      </div>
      <Button variant="primary" onClick={onSubmit} loading={submitting}>Submit</Button>
    </footer>
  )
}
