import { useParams, Link } from 'react-router-dom'
import { BaseLayout, Text, Button } from '@afwilto/design-system'
import { CS3_PROJECTS } from './data'
import { CS3ProjectPage } from './CS3ProjectPage'

export function CS3ProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const project = CS3_PROJECTS.find(p => p.slug === projectSlug)

  if (!project) {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Project not found</Text>
          <Text variant="body" color="muted">No CS3 project matches <span className="font-mono">{projectSlug}</span>.</Text>
          <Link to="/slab/ud/computer-science-3">
            <Button variant="secondary">← Back to CS3</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  return <CS3ProjectPage project={project} />
}
