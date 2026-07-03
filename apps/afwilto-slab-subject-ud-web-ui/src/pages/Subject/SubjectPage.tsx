import type { ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BaseLayout, Text, Badge, Card, Button } from '@afwilto/design-system'
import { UD_SUBJECTS, UD_INFO, UD_CATEGORY_STYLE } from '@/pages/UniversidadDistrital/data'
import { UNIANDES_SUBJECTS, UNIANDES_INFO, UNIANDES_CATEGORY_STYLE } from '@/pages/Uniandes/data'

type University = 'distrital' | 'uniandes'

interface SubjectPageProps {
  university: University
  /** When provided, replaces the "coming soon" placeholder with real content. */
  children?: ReactNode
  /**
   * Override the slug instead of reading it from useParams.
   * Required when the parent route is static (not parameterised), e.g. the
   * dedicated /slab/ud/computer-science-1 route.
   */
  slug?: string
}

export function SubjectPage({ university, children, slug: slugProp }: SubjectPageProps) {
  const { subjectSlug: slugFromParams } = useParams<{ subjectSlug: string }>()
  const subjectSlug = slugProp ?? slugFromParams

  const isDistital = university === 'distrital'
  const subjects = isDistital ? UD_SUBJECTS : UNIANDES_SUBJECTS
  const info = isDistital ? UD_INFO : UNIANDES_INFO
  const categoryStyle = isDistital ? UD_CATEGORY_STYLE : UNIANDES_CATEGORY_STYLE
  const backPath = isDistital ? '/slab/ud' : '/uniandes'

  const subject = subjects.find((s) => s.slug === subjectSlug)

  if (!subject) {
    return (
      <BaseLayout>
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <Text variant="h2" color="primary">Subject not found</Text>
          <Link to={backPath}>
            <Button variant="secondary">← Back to {info.acronym}</Button>
          </Link>
        </div>
      </BaseLayout>
    )
  }

  const style = (categoryStyle as any)[subject.category]

  return (
    <BaseLayout>
      <div className={`flex flex-col gap-8 ${children ? 'w-full' : 'max-w-4xl'}`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to={backPath} className="text-neutral-500 hover:text-neutral-300 transition-colors">
            {info.acronym}
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">{subject.title}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={style.badge as any} size="md">{subject.category}</Badge>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `${info.accentColor}18`,
                color: info.accentColor,
                border: `1px solid ${info.accentColor}40`,
              }}
            >
              {info.acronym} · {info.career}
            </span>
          </div>

          <Text variant="h1" color="default">{subject.title}</Text>
          <Text variant="body" color="muted" className="max-w-2xl">{subject.description}</Text>
        </div>

        {/* Subject content — custom when provided, placeholder otherwise */}
        {children ?? (
          <Card
            padding="lg"
            className="flex flex-col items-center gap-6 text-center border-dashed border-2"
            style={{ borderColor: `${info.accentColor}30` }}
          >
            <span className="text-5xl">{'icon' in subject ? (subject as any).icon : '📚'}</span>
            <div className="flex flex-col gap-2">
              <Text variant="h3" color="default">Content in Progress</Text>
              <Text variant="body" color="muted" className="max-w-md">
                This subject page is being built. Projects, notes, and resources for{' '}
                <span className="text-neutral-200 font-medium">{subject.title}</span>{' '}
                will appear here soon.
              </Text>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={backPath}>
                <Button variant="secondary" size="sm">← Back to {info.acronym}</Button>
              </Link>
              <Button variant="ghost" size="sm" disabled>View Projects</Button>
            </div>
          </Card>
        )}

        {/* University context strip */}
        <div
          className="flex items-center gap-4 p-4 rounded-xl"
          style={{
            backgroundColor: `${info.accentColor}0D`,
            border: `1px solid ${info.accentColor}25`,
          }}
        >
          <img
            src={info.logoUrl}
            alt={info.acronym}
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col">
            <Text variant="small" weight="semibold" color="default">{info.name}</Text>
            <Text variant="caption" color="muted">{info.career} · {info.location}</Text>
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
