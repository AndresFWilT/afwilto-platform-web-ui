import { Link } from 'react-router-dom'
import { Badge, Button, Card, Text } from '@afwilto/design-system'
import { SE_PROJECTS, type SoftwareEngineeringProject } from './data'

// Spec 17 FR-8: personal software-engineering projects, shown above the
// academic institutions. The grid is intrinsic (auto-fill), so no
// breakpoint utility competes with the shell's Tailwind build.
export function SoftwareEngineeringSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Text variant="h2" color="default">Software Engineering</Text>
        <Text variant="body" color="muted">
          Standalone engineering projects, each with its own microfrontend and backend service.
        </Text>
        <div className="h-px w-16 bg-primary-500 mt-1" />
      </div>

      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]">
        {SE_PROJECTS.map((project) => (
          <ProjectCard key={project.to} project={project} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: SoftwareEngineeringProject }) {
  const titleId = `se-project-${project.to.replaceAll('/', '-')}`
  return (
    <article aria-labelledby={titleId}>
      <Card padding="none" className="flex flex-col overflow-hidden h-full">
        <div className="h-2 w-full" style={{ backgroundColor: project.accentColor }} />
        <div className="flex flex-col gap-4 p-6 flex-1">
          <Text id={titleId} variant="h4" color="default" className="leading-tight">
            {project.title}
          </Text>
          <Text variant="small" color="muted" className="leading-relaxed">
            {project.description}
          </Text>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} size="sm">{tag}</Badge>
            ))}
          </div>
          <Link to={project.to} className="mt-auto">
            <Button variant="ghost" size="sm" className="self-start">
              Open project →
            </Button>
          </Link>
        </div>
      </Card>
    </article>
  )
}
