import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Text, Card, Badge } from '@afwilto/design-system'
import { SubjectPage } from '@/pages/Subject'
import { ProjectArtwork } from './cs2/ProjectArtwork'
import { CS2_PROJECTS, CS2_CATEGORY_COLOR } from './cs2/data'
import type { CS2Category, CS2Project } from './cs2/data'

export function ComputerScience2Page() {
  return (
    <SubjectPage university="distrital" slug="computer-science-2">
      <CS2ProjectGrid />
    </SubjectPage>
  )
}

function CS2ProjectGrid() {
  const [active, setActive] = useState<CS2Category | 'All'>('All')

  const categories: (CS2Category | 'All')[] = [
    'All',
    ...Array.from(new Set(CS2_PROJECTS.map(p => p.category))) as CS2Category[],
  ]

  const visible = active === 'All'
    ? CS2_PROJECTS
    : CS2_PROJECTS.filter(p => p.category === active)

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Text variant="h3" color="default">Projects</Text>
          <Text variant="caption" color="muted">
            Originally written in Java — each will be refactored to Go following Hexagonal Architecture.
          </Text>
        </div>
        <Text variant="small" color="muted">{visible.length} of {CS2_PROJECTS.length}</Text>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const color = cat === 'All' ? '#5767C1' : CS2_CATEGORY_COLOR[cat as CS2Category]
          const isActive = active === cat
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-white'
                  : 'bg-surface-raised border border-surface-border text-neutral-400 hover:text-neutral-100'
              )}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(project => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: CS2Project }) {
  const categoryColor = CS2_CATEGORY_COLOR[project.category]

  return (
    <Link
      to={`/slab/ud/computer-science-2/${project.slug}`}
      className="group block h-full"
    >
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-500/60 group-hover:shadow-xl"
      >
        {/* SVG artwork thumbnail */}
        <div className="relative shrink-0">
          <ProjectArtwork project={project} className="h-36 w-full" />
          {/* Category pill overlaid on thumbnail */}
          <span
            className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: `${categoryColor}cc`, color: 'white', border: `1px solid rgba(255,255,255,0.2)` }}
          >
            {project.category}
          </span>
          {/* Arrow indicator */}
          <span className="absolute bottom-2.5 right-3 text-white/0 group-hover:text-white/70 transition-all text-sm">
            →
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          <Text variant="small" weight="semibold" color="default" className="leading-snug">
            {project.title}
          </Text>
          <Text variant="caption" color="muted" className="leading-relaxed line-clamp-3">
            {project.description}
          </Text>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="font-mono text-xs text-primary-400 font-bold">{project.timeComplexity}</span>
            <Badge variant="neutral" size="sm">Java → Go</Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
