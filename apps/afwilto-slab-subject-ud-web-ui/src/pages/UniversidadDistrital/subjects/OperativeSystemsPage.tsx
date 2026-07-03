import { Link } from 'react-router-dom'
import { Text, Card, Badge } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'
import { ProjectArtwork } from './os/ProjectArtwork'
import { OS_PROJECTS, OS_CATEGORY_COLOR } from './os/data'
import type { OSProject } from './os/data'

export function OperativeSystemsPage() {
  return (
    <SubjectPage university="distrital" slug="operative-systems">
      <OSProjectGrid />
    </SubjectPage>
  )
}

function OSProjectGrid() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="h3" color="default">Projects</Text>
        <Text variant="caption" color="muted">
          Migrated from Java/Swing — algorithms genuinely implemented with configurable parameters.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OS_PROJECTS.map(project => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: OSProject }) {
  const categoryColor = OS_CATEGORY_COLOR[project.category]

  return (
    <Link
      to={`/slab/ud/operative-systems/${project.slug}`}
      className="group block h-full"
    >
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-500/60 group-hover:shadow-xl"
      >
        <div className="relative shrink-0">
          <ProjectArtwork project={project} className="h-40 w-full" />
          <span
            className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: `${categoryColor}cc`, color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            {project.category}
          </span>
          <span className="absolute bottom-2.5 right-3 text-white/0 group-hover:text-white/70 transition-all text-sm">→</span>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1">
          <Text variant="small" weight="semibold" color="default" className="leading-snug">
            {project.title}
          </Text>
          <Text variant="caption" color="muted" className="leading-relaxed line-clamp-3">
            {project.description}
          </Text>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-primary-400 font-bold">{project.concept}</span>
            <Badge variant="success" size="sm">Live</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
