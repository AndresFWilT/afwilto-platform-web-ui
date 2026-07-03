import { useRoutes } from 'react-router-dom'
import { ErrorBoundary } from '@afwilto/design-system'
import { routes } from '@/router'
import './index.css'

export function App() {
  const element = useRoutes(routes)
  return <ErrorBoundary>{element}</ErrorBoundary>
}

export default App
