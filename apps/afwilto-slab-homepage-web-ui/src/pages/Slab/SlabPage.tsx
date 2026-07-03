import { Link } from 'react-router-dom'
import { BaseLayout, Text, Card, Button, Badge } from '@afwilto/design-system'
import { UD_INFO, UNIANDES_INFO } from './data'

export function SlabPage() {
  return (
    <BaseLayout>
      <div className="flex flex-col gap-16">
        <Hero />
        <UniversitiesSection />
      </div>
    </BaseLayout>
  )
}

function Hero() {
  return (
    <section className="flex flex-col items-center text-center gap-6 py-12 sm:py-16 lg:py-20">
      <Badge variant="primary" size="md">University Project Portfolio</Badge>

      <Text variant="h1" color="default" className="max-w-3xl">
        AFWILTO{' '}
        <span className="text-primary-400">Software Lab</span>
      </Text>

      <Text variant="body" color="muted" className="max-w-2xl leading-relaxed">
        A living portfolio of software engineering projects developed throughout my university journey.
        Each project is migrated, refactored, and documented following{' '}
        <span className="text-neutral-200 font-medium">Domain-Driven Design</span>,{' '}
        <span className="text-neutral-200 font-medium">Hexagonal Architecture</span>, and{' '}
        <span className="text-neutral-200 font-medium">Atomic Design</span> principles — built to
        last, not just to ship.
      </Text>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link to="/design-system">
          <Button variant="secondary" size="lg">Design System</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-3xl">
        {PILLARS.map((p) => (
          <div
            key={p.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-raised border border-surface-border"
          >
            <span className="text-2xl">{p.icon}</span>
            <Text variant="small" weight="semibold" color="primary">{p.label}</Text>
            <Text variant="caption" color="muted" className="text-center">{p.desc}</Text>
          </div>
        ))}
      </div>
    </section>
  )
}

function UniversitiesSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Text variant="h2" color="default">Academic Institutions</Text>
        <Text variant="body" color="muted">
          Projects developed across two of Colombia's most prestigious universities.
        </Text>
        <div className="h-px w-16 bg-primary-500 mt-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UniversityCard
          to="/slab/ud"
          logoUrl={UD_INFO.logoUrl}
          name={UD_INFO.name}
          acronym={UD_INFO.acronym}
          location={UD_INFO.location}
          type={UD_INFO.type}
          description="Colombia's largest public university. Projects here span systems engineering, algorithms, data structures, and software architecture — 17 subjects across the core curriculum."
          accentColor={UD_INFO.accentColor}
          badgeColor={UD_INFO.goldColor}
          badgeText={UD_INFO.career}
          stats={[
            { label: 'Founded', value: UD_INFO.founded },
            { label: 'Subjects', value: '17' },
          ]}
        />
        <UniversityCard
          to="/slab/mati"
          logoUrl={UNIANDES_INFO.logoUrl}
          name={UNIANDES_INFO.name}
          acronym={UNIANDES_INFO.acronym}
          location={UNIANDES_INFO.location}
          type={UNIANDES_INFO.type}
          description="One of Latin America's top private research universities. Graduate-level master's degree covering enterprise, cloud, security, and next-generation architecture disciplines."
          accentColor={UNIANDES_INFO.accentColor}
          badgeColor={UNIANDES_INFO.goldColor}
          badgeText={UNIANDES_INFO.career}
          stats={[
            { label: 'Founded', value: UNIANDES_INFO.founded },
            { label: 'Subjects', value: '10' },
          ]}
        />
      </div>
    </section>
  )
}

interface UniversityCardProps {
  to: string
  logoUrl: string
  name: string
  acronym: string
  location: string
  type: string
  description: string
  accentColor: string
  badgeColor: string
  badgeText: string
  stats: Array<{ label: string; value: string }>
}

function UniversityCard({
  to,
  logoUrl,
  name,
  acronym,
  location,
  type,
  description,
  accentColor,
  badgeColor,
  badgeText,
  stats,
}: UniversityCardProps) {
  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <div
        className="h-2 w-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center p-2 overflow-hidden"
            style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}40` }}
          >
            <img
              src={logoUrl}
              alt={`${acronym} logo`}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          <span
            className="mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44` }}
          >
            {badgeText}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <Text variant="h4" color="default" className="leading-tight">{name}</Text>
          <div className="flex items-center gap-2">
            <Text variant="caption" color="muted">{location}</Text>
            <span className="text-neutral-600">·</span>
            <Text variant="caption" color="muted">{type}</Text>
          </div>
        </div>

        <Text variant="small" color="muted" className="leading-relaxed">{description}</Text>

        <div className="flex gap-6 pt-2 border-t border-surface-border">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <Text variant="caption" color="muted">{s.label}</Text>
              <Text variant="small" weight="semibold" color="default">{s.value}</Text>
            </div>
          ))}
        </div>

        <Link to={to}>
          <Button variant="ghost" size="sm" className="self-start">
            View Projects →
          </Button>
        </Link>
      </div>
    </Card>
  )
}

const PILLARS = [
  { icon: '⚛', label: 'Atomic Design', desc: 'atoms → molecules → organisms → pages' },
  { icon: '⬡', label: 'Hexagonal Arch', desc: 'ports & adapters, DIP, clean layers' },
  { icon: '🗂', label: 'DDD', desc: 'domain-first where business logic lives' },
]
