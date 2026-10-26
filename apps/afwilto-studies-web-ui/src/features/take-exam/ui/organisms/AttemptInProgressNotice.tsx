import { Alert } from '@afwilto/design-system'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'

/** An exam can have one open attempt (BR-A1): the only way forward is to continue it. */
export function AttemptInProgressNotice({ attemptId }: { attemptId: string }) {
  return (
    <Alert variant="warning" title="You have a practice exam in progress">
      <div className="flex flex-col items-start gap-2">
        <p>Finish or submit the open practice exam before starting another.</p>
        <ButtonLink to={`/studies/attempts/${attemptId}`}>Continue</ButtonLink>
      </div>
    </Alert>
  )
}
