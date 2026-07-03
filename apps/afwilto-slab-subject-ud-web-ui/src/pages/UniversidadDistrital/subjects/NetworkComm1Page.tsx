import { SubjectPage } from '@/pages/Subject'
import { WeatherDashboard } from './network-comm-1/WeatherDashboard'

export function NetworkComm1Page() {
  return (
    <SubjectPage university="distrital" slug="network-communication-1">
      <WeatherDashboard />
    </SubjectPage>
  )
}
