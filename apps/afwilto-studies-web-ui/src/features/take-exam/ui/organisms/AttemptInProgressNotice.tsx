import { Alert } from '@afwilto/design-system'
import { ButtonLink } from '@/shared/ui/atoms/ButtonLink'

/** An exam can have one open attempt (BR-A1): the only way forward is to continue it. */
export function AttemptInProgressNotice({ attemptId }: { attemptId: string }) {
  return (
    <Alert variant="warning" title="Tienes un simulacro en curso">
      <div className="flex flex-col items-start gap-2">
        <p>Termina o entrega el simulacro abierto antes de empezar otro.</p>
        <ButtonLink to={`/studies/attempts/${attemptId}`}>Continuar</ButtonLink>
      </div>
    </Alert>
  )
}
