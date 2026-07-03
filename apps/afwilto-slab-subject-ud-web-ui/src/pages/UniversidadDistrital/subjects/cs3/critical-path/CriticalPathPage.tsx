import { CS3_PROJECTS } from '../data'
import { CS3ProjectPage } from '../CS3ProjectPage'
import { CriticalPathApp } from '../CriticalPathApp'

const PROJECT = CS3_PROJECTS.find(p => p.slug === 'critical-path')!

export function CriticalPathPage() {
  return (
    <CS3ProjectPage project={PROJECT}>
      <CriticalPathApp />
    </CS3ProjectPage>
  )
}
