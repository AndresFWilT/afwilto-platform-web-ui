import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Badge, Card } from '@afwilto/design-system'
import { UD_INFO } from '@/pages/UniversidadDistrital/data'
import { ProjectArtwork } from './ProjectArtwork'
import { OR1_CATEGORY_COLOR } from './data'
import type { OR1Project } from './data'

interface Props {
  project: OR1Project
  children?: ReactNode
}

export function OR1ProjectPage({ project, children }: Props) {
  const categoryColor = OR1_CATEGORY_COLOR[project.category]

  return (
    <BaseLayout>
      <div className="flex flex-col gap-8 w-full">
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/operations-research-1" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Operations Research I
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{project.title}</span>
        </nav>

        <Card padding="none" className="overflow-hidden">
          <ProjectArtwork project={project} className="h-48 w-full" />
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${categoryColor}22`, color: categoryColor, border: `1px solid ${categoryColor}44` }}
              >
                {project.category}
              </span>
              <Badge variant="neutral" size="sm">{project.algorithm}</Badge>
              <Badge variant="neutral" size="sm">{project.complexity}</Badge>
            </div>
            <Text variant="h1" color="default">{project.title}</Text>
            <Text variant="small" color="muted" className="leading-relaxed max-w-2xl">
              {project.detail}
            </Text>
            <Text variant="caption" color="muted">
              {UD_INFO.name} · {UD_INFO.careerEs}
            </Text>
          </div>
        </Card>

        {children ?? (
          <Card padding="md" className="flex flex-col items-center gap-3 py-12">
            <Text variant="h4" color="muted">Interactive solver</Text>
            <Text variant="body" color="muted" className="text-center max-w-md">
              Use the direct link from the project grid to open the live solver.
            </Text>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
