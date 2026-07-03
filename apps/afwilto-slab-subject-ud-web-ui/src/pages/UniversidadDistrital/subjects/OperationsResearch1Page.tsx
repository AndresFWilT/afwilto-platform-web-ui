import { Link } from 'react-router-dom'
import { Text, Card, Badge } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'
import { ProjectArtwork } from './or1/ProjectArtwork'
import { OR1_PROJECTS, OR1_CATEGORY_COLOR } from './or1/data'
import type { OR1Project } from './or1/data'

export function OperationsResearch1Page() {
  return (
    <SubjectPage university="distrital" slug="operations-research-1">
      <OR1ProjectGrid />
    </SubjectPage>
  )
}

function OR1ProjectGrid() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="h3" color="default">Projects</Text>
        <Text variant="caption" color="muted">
          Migrated from Python/Tkinter — algorithms genuinely implemented (no hardcoded responses).
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OR1_PROJECTS.map(project => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: OR1Project }) {
  const categoryColor = OR1_CATEGORY_COLOR[project.category]

  return (
    <Link
      to={`/slab/ud/operations-research-1/${project.slug}`}
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
          <span className="absolute bottom-2.5 right-3 text-white/0 group-hover:text-white/70 transition-all text-sm">
            →
          </span>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1">
          <Text variant="small" weight="semibold" color="default" className="leading-snug">
            {project.title}
          </Text>
          <Text variant="caption" color="muted" className="leading-relaxed line-clamp-3">
            {project.description}
          </Text>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-primary-400 font-bold">{project.algorithm}</span>
            <Badge variant="success" size="sm">Live</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
