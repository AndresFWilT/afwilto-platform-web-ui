import { Alert } from '@afwilto/design-system'

export function LoadError({ error, title = 'No se pudo cargar' }: { error: Error; title?: string }) {
  return (
    <Alert variant="error" title={title}>
      {error.message}
    </Alert>
  )
}
