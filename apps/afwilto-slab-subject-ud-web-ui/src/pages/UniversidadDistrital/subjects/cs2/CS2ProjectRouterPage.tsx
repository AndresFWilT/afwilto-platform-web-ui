import { useParams, Link } from 'react-router-dom'
import { BaseLayout, Text, Button } from '@afwilto/design-system'
import { CS2_PROJECTS } from './data'
import { CS2ProjectPage } from './CS2ProjectPage'

export function CS2ProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const project = CS2_PROJECTS.find(p => p.slug === projectSlug)

  if (!project) {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Project not found</Text>
          <Text variant="body" color="muted">No CS2 project matches <span className="font-mono">{projectSlug}</span>.</Text>
          <Link to="/slab/ud/computer-science-2">
            <Button variant="secondary">← Back to CS2</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  return <CS2ProjectPage project={project} />
}
