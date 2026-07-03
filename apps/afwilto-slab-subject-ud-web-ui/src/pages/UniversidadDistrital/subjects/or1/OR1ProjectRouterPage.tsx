import { useParams, Link } from 'react-router-dom'
import { BaseLayout, Text, Button } from '@afwilto/design-system'
import { OR1_PROJECTS } from './data'
import { OR1ProjectPage } from './OR1ProjectPage'

export function OR1ProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const project = OR1_PROJECTS.find(p => p.slug === projectSlug)

  if (!project) {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Project not found</Text>
          <Text variant="body" color="muted">
            No OR1 project matches <span className="font-mono">{projectSlug}</span>.
          </Text>
          <Link to="/slab/ud/operations-research-1">
            <Button variant="secondary">← Back to Operations Research I</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  return <OR1ProjectPage project={project} />
}
