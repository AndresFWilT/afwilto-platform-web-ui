import { SubjectPage } from '@/pages/Subject'
import { PhysicsLabWizard } from './physics-lab/PhysicsLabWizard'

export function PhysicsLabPage() {
  return (
    <SubjectPage university="distrital" slug="physics-lab">
      <PhysicsLabWizard />
    </SubjectPage>
  )
}
