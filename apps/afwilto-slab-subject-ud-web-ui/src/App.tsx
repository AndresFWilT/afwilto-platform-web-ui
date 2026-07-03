import { useRoutes } from 'react-router-dom'
import { ErrorBoundary } from '@afwilto/design-system'
import { ServiceProvider } from '@/di'
import { routes } from '@/router'
import './index.css'

export function App() {
  const element = useRoutes(routes)
  return (
    <ErrorBoundary>
      <ServiceProvider>{element}</ServiceProvider>
    </ErrorBoundary>
  )
}

export default App
