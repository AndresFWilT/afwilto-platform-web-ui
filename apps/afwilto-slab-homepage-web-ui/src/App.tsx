import { ErrorBoundary } from '@afwilto/design-system'
import { SlabPage } from '@/pages/Slab'
import './index.css'

export function App() {
  return (
    <ErrorBoundary>
      <SlabPage />
    </ErrorBoundary>
  )
}

export default App
