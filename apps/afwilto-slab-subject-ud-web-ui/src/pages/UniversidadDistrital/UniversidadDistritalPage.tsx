import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { BaseLayout, Text, Badge, Card } from '@afwilto/design-system'
import {
  UD_INFO,
  UD_SUBJECTS,
  UD_CATEGORY_STYLE,
  type UDCategory,
  type UDSubject,
} from './data'

export function UniversidadDistritalPage() {
  const [activeCategory, setActiveCategory] = useState<UDCategory | 'All'>('All')

  const categories = ['All', ...Array.from(new Set(UD_SUBJECTS.map((s) => s.category)))] as const

  const visible =
    activeCategory === 'All'
      ? UD_SUBJECTS
      : UD_SUBJECTS.filter((s) => s.category === activeCategory)

  return (
    <BaseLayout>
      <div className="flex flex-col gap-10">
        <UniversityHeader />
        <div className="h-px bg-surface-border" />
        <SubjectsGrid
          subjects={visible}
          categories={categories as unknown as (UDCategory | 'All')[]}
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
          className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center p-2 shadow-lg"
          style={{ backgroundColor: `${UD_INFO.accentColor}18`, border: `1px solid ${UD_INFO.accentColor}40` }}
        >
          <img
            src={UD_INFO.logoUrl}
            alt={`${UD_INFO.acronym} logo`}
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
                backgroundColor: `${UD_INFO.goldColor}22`,
                color: UD_INFO.goldColor,
                border: `1px solid ${UD_INFO.goldColor}40`,
              }}
            >
              {UD_INFO.type}
            </span>
            <span className="text-xs text-neutral-500">{UD_INFO.location}</span>
          </div>

          <Text variant="h2" color="default" className="leading-tight">
            {UD_INFO.name}
          </Text>

          <div className="flex items-center gap-3">
            <div
              className="h-0.5 w-8 rounded-full"
              style={{ backgroundColor: UD_INFO.accentColor }}
            />
            <Text variant="body" weight="semibold" style={{ color: UD_INFO.accentColor }}>
              {UD_INFO.career}
            </Text>
            <Text variant="small" color="muted">— {UD_INFO.careerEs}</Text>
          </div>
        </div>
      </div>

      {/* Description */}
      <Text variant="body" color="muted" className="max-w-3xl leading-relaxed">
        {UD_INFO.description}
      </Text>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-6">
        <Stat label="Founded" value={UD_INFO.founded} />
        <Stat label="Total Subjects" value={String(UD_SUBJECTS.length)} />
        <Stat label="Faculty" value="Engineering" />
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
  subjects: UDSubject[]
  categories: (UDCategory | 'All')[]
  activeCategory: UDCategory | 'All'
  onCategory: (c: UDCategory | 'All') => void
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
                ? { backgroundColor: UD_INFO.accentColor }
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

function SubjectCard({ subject }: { subject: UDSubject }) {
  const style = UD_CATEGORY_STYLE[subject.category]

  return (
    <Link
      to={`/slab/ud/${subject.slug}`}
      className="group block h-full"
    >
      <Card
        padding="none"
        className="h-full flex flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary-500/60 group-hover:shadow-xl"
      >
        {/* Gradient header */}
        <div
          className={clsx(
            'relative h-32 flex items-center justify-center bg-gradient-to-br shrink-0',
            style.gradient
          )}
        >
          {/* Number */}
          <span className="absolute top-3 left-3 text-xs font-mono text-white/30">
            {subject.number}
          </span>
          {/* Icon */}
          <span className="text-4xl drop-shadow-lg select-none">{subject.icon}</span>
          {/* Hover arrow */}
          <span className="absolute bottom-3 right-3 text-white/0 group-hover:text-white/60 transition-all text-sm">
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
