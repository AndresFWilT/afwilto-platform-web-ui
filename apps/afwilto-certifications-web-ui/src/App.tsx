import { useRoutes } from 'react-router-dom'
import { ErrorBoundary } from '@afwilto/design-system'
import { ServiceProvider, type ServiceContainer } from '@/di'
import { routes } from '@/router'
import './index.css'

export function App({ value }: { value?: ServiceContainer }) {
  const element = useRoutes(routes)
  return (
    <ErrorBoundary>
      <ServiceProvider value={value}>{element}</ServiceProvider>
    </ErrorBoundary>
  )
}

export default App
