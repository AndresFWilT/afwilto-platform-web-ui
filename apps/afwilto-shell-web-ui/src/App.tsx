import { ErrorBoundary } from '@afwilto/design-system'
import { AppRoutes } from '@/router/AppRoutes'

export function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}
