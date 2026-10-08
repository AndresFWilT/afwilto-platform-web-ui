import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Alert, Button, EmptyState, Skeleton, Tag, Text,
} from '@afwilto/design-system'
import { useTimeline } from '@/hooks/useTimeline'
import { TimelineCanvas } from './TimelineCanvas'

export function TimelinePage() {
  const { year, laned, unscheduled, loading, error, setYear } = useTimeline()
  const navigate = useNavigate()
  const [unscheduledOpen, setUnscheduledOpen] = useState(true)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center gap-4">
        <Text as="h1" variant="h2" className="flex-1">
          Timeline
        </Text>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label="previous year"
            onClick={() => setYear(year - 1)}
          >
            ◀
          </Button>
          <Text variant="body" className="w-14 text-center select-none">
            {year}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            aria-label="next year"
            onClick={() => setYear(year + 1)}
          >
            ▶
          </Button>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('../new')}>
          + New
        </Button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-full rounded" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <Alert variant="error" title="Failed to load timeline">
          {error.message}
        </Alert>
      )}

      {/* ── Canvas ── */}
      {!loading && !error && (
        <>
          {laned.length === 0 && unscheduled.length === 0 ? (
            <EmptyState
              title={`Nothing planned for ${year}`}
              description="Add a certification with study dates to see it on the timeline."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('../new')}>
                  Plan a certification
                </Button>
              }
            />
          ) : (
            <TimelineCanvas year={year} laned={laned} />
          )}

          {/* ── Unscheduled tray ── */}
          {unscheduled.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors text-sm self-start"
                aria-expanded={unscheduledOpen}
                onClick={() => setUnscheduledOpen((v) => !v)}
              >
                <span>{unscheduledOpen ? '▾' : '▸'}</span>
                <span>Unscheduled ({unscheduled.length})</span>
              </button>
              {unscheduledOpen && (
                <div className="flex flex-wrap gap-2">
                  {unscheduled.map((cert) => (
                    <Tag
                      key={cert.id}
                      style={{
                        backgroundColor:
                          cert.category ? cert.category.color + '22' : undefined,
                      }}
                    >
                      <Link
                        to={`../${cert.id}`}
                        className="text-neutral-200 hover:text-white transition-colors text-sm"
                      >
                        {cert.name}
                      </Link>
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Legend ── */}
          {laned.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2">
              {Array.from(
                new Map(
                  laned
                    .filter((l) => l.item.category)
                    .map((l) => [l.item.category!.id, l.item.category!]),
                ).entries(),
              ).map(([id, category]) => (
                <div key={id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <Text variant="small" color="muted">
                    {category.path}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  )
}
