import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { BaseLayout, Text, Badge, Card } from '@afwilto/design-system'
import {
  UNIANDES_INFO,
  UNIANDES_SUBJECTS,
  UNIANDES_CATEGORY_STYLE,
  type UniandesCategory,
  type UniandesSubject,
} from './data'

export function MatiPage() {
  const [activeCategory, setActiveCategory] = useState<UniandesCategory | 'All'>('All')

  const categories = [
    'All',
    ...Array.from(new Set(UNIANDES_SUBJECTS.map((s) => s.category))),
  ] as const

  const visible =
    activeCategory === 'All'
      ? UNIANDES_SUBJECTS
      : UNIANDES_SUBJECTS.filter((s) => s.category === activeCategory)

  return (
    <BaseLayout>
      <div className="flex flex-col gap-10">
        <UniversityHeader />
        <div className="h-px bg-surface-border" />
        <SubjectsGrid
          subjects={visible}
          categories={categories as unknown as (UniandesCategory | 'All')[]}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
        />
      </div>
    </BaseLayout>
  )
}

/* ── University header ───────────────────────────────────────────────────── */

function UniversityHeader() {
  return (
    <div className="flex flex-col gap-8">
      {/* Logo + identity row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Logo container */}
        <div
          className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-3 shadow-lg overflow-hidden"
          style={{
            backgroundColor: `${UNIANDES_INFO.accentColor}18`,
            border: `1px solid ${UNIANDES_INFO.accentColor}40`,
          }}
        >
          <img
            src={UNIANDES_INFO.logoUrl}
            alt={`${UNIANDES_INFO.acronym} logo`}
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>

        {/* Identity */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `${UNIANDES_INFO.goldColor}22`,
                color: UNIANDES_INFO.goldColor,
                border: `1px solid ${UNIANDES_INFO.goldColor}40`,
              }}
            >
              {UNIANDES_INFO.type}
            </span>
            <span className="text-xs text-neutral-500">{UNIANDES_INFO.location}</span>
          </div>

          <Text variant="h2" color="default" className="leading-tight">
            {UNIANDES_INFO.name}
          </Text>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="h-0.5 w-8 rounded-full"
              style={{ backgroundColor: UNIANDES_INFO.accentColor }}
            />
            <Text variant="body" weight="semibold" style={{ color: UNIANDES_INFO.accentColor }}>
              {UNIANDES_INFO.career}
            </Text>
            <Text variant="small" color="muted">— {UNIANDES_INFO.careerFull}</Text>
          </div>
        </div>
      </div>

      {/* Description */}
      <Text variant="body" color="muted" className="max-w-3xl leading-relaxed">
        {UNIANDES_INFO.description}
      </Text>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-6">
        <Stat label="Founded" value={UNIANDES_INFO.founded} />
        <Stat label="Total Subjects" value={String(UNIANDES_SUBJECTS.length)} />
        <Stat label="Degree" value="Master's" />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <Text variant="h4" color="default">{value}</Text>
    </div>
  )
}

/* ── Subjects grid ───────────────────────────────────────────────────────── */

interface SubjectsGridProps {
  subjects: UniandesSubject[]
  categories: (UniandesCategory | 'All')[]
  activeCategory: UniandesCategory | 'All'
  onCategory: (c: UniandesCategory | 'All') => void
}

function SubjectsGrid({ subjects, categories, activeCategory, onCategory }: SubjectsGridProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Text variant="h3" color="default">Subjects</Text>
        <Text variant="small" color="muted">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</Text>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150',
              activeCategory === cat
                ? 'text-white'
                : 'bg-surface-raised border border-surface-border text-neutral-400 hover:text-neutral-100 hover:border-primary-500'
            )}
            style={
              activeCategory === cat
                ? { backgroundColor: UNIANDES_INFO.accentColor }
                : undefined
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject.slug} subject={subject} />
        ))}
      </div>
    </div>
  )
}

/* ── Subject card ────────────────────────────────────────────────────────── */

function SubjectCard({ subject }: { subject: UniandesSubject }) {
  const style = UNIANDES_CATEGORY_STYLE[subject.category]

  return (
    <Link to={`/slab/mati/${subject.slug}`} className="group block h-full">
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-500/60 group-hover:shadow-xl"
      >
        {/* Image or gradient header */}
        <div className="relative h-36 shrink-0 overflow-hidden">
          {subject.image ? (
            <img
              src={subject.image}
              alt={subject.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={clsx(
                'w-full h-full flex items-center justify-center bg-gradient-to-br',
                style.gradient
              )}
            >
              <span className="text-4xl drop-shadow-lg select-none">{subject.icon}</span>
            </div>
          )}
          {/* Overlay scrim on image cards */}
          {subject.image && (
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/20 to-transparent" />
          )}
          {/* Hover arrow */}
          <span className="absolute bottom-3 right-3 text-white/0 group-hover:text-white/80 transition-all text-sm">
            →
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          <Badge variant={style.badge as any} size="sm">{subject.category}</Badge>
          <Text variant="small" weight="semibold" color="default" className="leading-snug">
            {subject.title}
          </Text>
          <Text variant="caption" color="muted" className="leading-relaxed line-clamp-3">
            {subject.description}
          </Text>
        </div>
      </Card>
    </Link>
  )
}
