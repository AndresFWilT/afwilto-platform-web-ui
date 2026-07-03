import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Badge, Card, Button } from '@afwilto/design-system'
import { UD_INFO } from '@/pages/UniversidadDistrital/data'
import { ProjectArtwork } from './ProjectArtwork'
import { CS3_CATEGORY_COLOR } from './data'
import type { CS3Project } from './data'

interface CS3ProjectPageProps {
  project: CS3Project
  children?: ReactNode
}

export function CS3ProjectPage({ project, children }: CS3ProjectPageProps) {
  const categoryColor = CS3_CATEGORY_COLOR[project.category]

  return (
    <BaseLayout>
      <div className={`flex flex-col gap-8 w-full ${children ? '' : 'max-w-4xl'}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/computer-science-3" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Computer Science 3
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{project.title}</span>
        </nav>

        {/* Header card with artwork */}
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
              <Badge variant="neutral" size="sm">Java → Go</Badge>
              <Badge variant="neutral" size="sm">{project.timeComplexity}</Badge>
            </div>
            <Text variant="h1" color="default">{project.title}</Text>
            <Text variant="small" color="muted" className="leading-relaxed max-w-2xl">
              {project.titleEs} — {project.detail}
            </Text>
          </div>
        </Card>

        {/* Concepts + Complexity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md" className="flex flex-col gap-3">
            <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">Complexity</Text>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text variant="caption" color="muted">Time</Text>
                <span className="font-mono text-sm text-primary-400 font-bold">{project.timeComplexity}</span>
              </div>
              <div className="flex items-center justify-between">
                <Text variant="caption" color="muted">Space</Text>
                <span className="font-mono text-sm text-primary-400 font-bold">{project.spaceComplexity}</span>
              </div>
            </div>
          </Card>
          <Card padding="md" className="flex flex-col gap-3">
            <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">Key Concepts</Text>
            <div className="flex flex-wrap gap-1.5">
              {project.concepts.map(c => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ backgroundColor: `${categoryColor}18`, color: categoryColor, border: `1px solid ${categoryColor}30` }}>
                  {c}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Content or coming-soon */}
        {children ?? (
          <Card padding="lg" className="flex flex-col items-center gap-5 text-center border-dashed border-2"
            style={{ borderColor: `${categoryColor}30` }}>
            <span className="text-4xl">🚧</span>
            <div className="flex flex-col gap-2">
              <Text variant="h3" color="default">Implementation in Progress</Text>
              <Text variant="body" color="muted" className="max-w-md">
                The Go backend and React visualiser for{' '}
                <span className="font-medium text-neutral-200">{project.title}</span> are being built.
              </Text>
            </div>
            <Link to="/slab/ud/computer-science-3">
              <Button variant="secondary" size="sm">← Back to CS3</Button>
            </Link>
          </Card>
        )}

        {/* University strip */}
        <div className="flex items-center gap-4 p-4 rounded-xl"
          style={{ backgroundColor: `${UD_INFO.accentColor}0D`, border: `1px solid ${UD_INFO.accentColor}25` }}>
          <img src={UD_INFO.logoUrl} alt={UD_INFO.acronym} className="w-10 h-10 object-contain shrink-0" />
          <div className="flex flex-col">
            <Text variant="small" weight="semibold" color="default">{UD_INFO.name}</Text>
            <Text variant="caption" color="muted">{UD_INFO.career} · Computer Science 3 · {UD_INFO.location}</Text>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
