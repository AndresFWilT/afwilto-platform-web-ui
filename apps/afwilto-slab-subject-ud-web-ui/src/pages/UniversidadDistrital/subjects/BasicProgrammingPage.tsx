import { Link } from 'react-router-dom'
import { Text, Card, Badge } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'
import { ProjectArtwork } from './basic-programming/ProjectArtwork'
import { BP_PROJECTS, BP_CATEGORY_COLOR } from './basic-programming/data'
import type { BPProject } from './basic-programming/data'

export function BasicProgrammingPage() {
  return (
    <SubjectPage university="distrital" slug="basic-programming">
      <BPProjectGrid />
    </SubjectPage>
  )
}

function BPProjectGrid() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Text variant="h3" color="default">Projects</Text>
        <Text variant="caption" color="muted">
          Migrated from C++ console programs — rebuilt with Hexagonal Architecture on Quarkus.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BP_PROJECTS.map(project => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: BPProject }) {
  const categoryColor = BP_CATEGORY_COLOR[project.category]
  return (
    <Link to={`/slab/ud/basic-programming/${project.slug}`} className="group block h-full">
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-500/60 group-hover:shadow-xl"
      >
        <div className="relative shrink-0">
          <ProjectArtwork project={project} className="h-40 w-full" />
          <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: `${categoryColor}cc`, color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            {project.category}
          </span>
          <span className="absolute bottom-2.5 right-3 text-white/0 group-hover:text-white/70 transition-all text-sm">→</span>
        </div>
        <div className="flex flex-col gap-2 p-4 flex-1">
          <Text variant="small" weight="semibold" color="default" className="leading-snug">{project.title}</Text>
          <Text variant="caption" color="muted" className="leading-relaxed line-clamp-3">{project.description}</Text>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-primary-400 font-bold">{project.concept.split(' / ')[0]}</span>
            <Badge variant="primary" size="sm">Live</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
