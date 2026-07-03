import { useParams, Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card } from '@afwilto/design-system'
import { AI_PROJECTS } from './data'
import { ProjectArtwork } from './ProjectArtwork'
import { UD_INFO } from '@/pages/UniversidadDistrital/data'

export function AIProjectRouterPage() {
  const { projectSlug } = useParams<{ projectSlug: string }>()
  const project = AI_PROJECTS.find(p => p.slug === projectSlug)

  if (!project) {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Project not found</Text>
          <Text variant="body" color="muted">
            No AI project matches <span className="font-mono">{projectSlug}</span>.
          </Text>
          <Link to="/slab/ud/artificial-intelligence-1">
            <Button variant="secondary">← Back to Artificial Intelligence</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="flex flex-col gap-8 w-full">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/artificial-intelligence-1" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Artificial Intelligence
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{project.title}</span>
        </nav>

        <Card padding="none" className="overflow-hidden">
          <ProjectArtwork project={project} className="h-48 w-full" />
          <div className="p-6 flex flex-col gap-4">
            <Text variant="h1" color="default">{project.title}</Text>
            <Text variant="small" color="muted" className="leading-relaxed max-w-2xl">{project.detail}</Text>
            <Text variant="caption" color="muted">{UD_INFO.name} · {UD_INFO.careerEs}</Text>
          </div>
        </Card>
      </div>
    </BaseLayout>
  )
}
