import { useRoutes } from 'react-router-dom'
import { ErrorBoundary } from '@afwilto/design-system'
import { ServiceProvider, type ServiceContainer } from '@/shared/di'
import { container } from './di/container'
import { routes } from './routes'
import './index.css'

/** The federated entry (exposed as `cidr/App`), mounted at /slab/cidr/*. */
export function App({ value = container }: { value?: ServiceContainer }) {
  const element = useRoutes(routes)
  return (
    <ErrorBoundary>
      <ServiceProvider value={value}>{element}</ServiceProvider>
    </ErrorBoundary>
  )
}

export default App
