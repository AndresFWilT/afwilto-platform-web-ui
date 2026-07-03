import { ErrorBoundary } from '@afwilto/design-system'
import { HomePage } from '@/pages/Home'
import './index.css'

export function App() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  )
}

export default App
