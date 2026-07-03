import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Badge, Card, Button } from '@afwilto/design-system'
import { UD_INFO } from '@/pages/UniversidadDistrital/data'
import { ProjectArtwork } from './ProjectArtwork'
import { CS2_CATEGORY_COLOR } from './data'
import type { CS2Project } from './data'

interface CS2ProjectPageProps {
  project: CS2Project
  /** When provided, replaces the "coming soon" card with live content. */
  children?: ReactNode
}

export function CS2ProjectPage({ project, children }: CS2ProjectPageProps) {
  const categoryColor = CS2_CATEGORY_COLOR[project.category]

  return (
    <BaseLayout>
      <div className={`flex flex-col gap-8 w-full ${children ? '' : 'max-w-4xl'}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/computer-science-2" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Computer Science 2
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

        {/* Concepts + Complexity row */}
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
                <span
                  key={c}
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ backgroundColor: `${categoryColor}18`, color: categoryColor, border: `1px solid ${categoryColor}30` }}
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Planned API — only shown for placeholder pages, not live implementations */}
        {!children && (
          <Card padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Text variant="small" weight="semibold" color="muted" className="uppercase tracking-widest">Planned API</Text>
              <Badge variant="warning" size="sm">Coming Soon</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {project.plannedEndpoints.map((ep, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-border last:border-0">
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded shrink-0 w-16 text-center ${
                    ep.method === 'GET'    ? 'bg-green-500/20 text-green-300' :
                    ep.method === 'POST'   ? 'bg-blue-500/20 text-blue-300'  :
                    ep.method === 'DELETE' ? 'bg-red-500/20 text-red-300'    :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-neutral-300 shrink-0">{ep.path}</span>
                  <span className="text-xs text-neutral-500 ml-auto text-right hidden sm:block">{ep.description}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Project content — live when children provided, placeholder otherwise */}
        {children ?? (
          <Card
            padding="lg"
            className="flex flex-col items-center gap-5 text-center border-dashed border-2"
            style={{ borderColor: `${categoryColor}30` }}
          >
            <span className="text-4xl">🚧</span>
            <div className="flex flex-col gap-2">
              <Text variant="h3" color="default">Implementation in Progress</Text>
              <Text variant="body" color="muted" className="max-w-md">
                The Go backend and React visualiser for{' '}
                <span className="font-medium text-neutral-200">{project.title}</span> are being built.
                The API contract above defines what will be available.
              </Text>
            </div>
            <Link to="/slab/ud/computer-science-2">
              <Button variant="secondary" size="sm">← Back to CS2</Button>
            </Link>
          </Card>
        )}

        {/* University strip */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{ backgroundColor: `${UD_INFO.accentColor}0D`, border: `1px solid ${UD_INFO.accentColor}25` }}
        >
          <img src={UD_INFO.logoUrl} alt={UD_INFO.acronym} className="w-10 h-10 object-contain shrink-0" />
          <div className="flex flex-col">
            <Text variant="small" weight="semibold" color="default">{UD_INFO.name}</Text>
            <Text variant="caption" color="muted">{UD_INFO.career} · Computer Science 2 · {UD_INFO.location}</Text>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
