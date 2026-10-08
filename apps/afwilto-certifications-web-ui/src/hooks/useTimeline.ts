import { useSearchParams } from 'react-router-dom'
import { useTimelineData } from '@/hooks/useTimelineData'
import type { LanedItem } from '@/domain/timeline'
import type { Certification } from '@/application/ports'

interface TimelineState {
  year: number
  laned: LanedItem[]
  unscheduled: Certification[]
  loading: boolean
  error: Error | null
  setYear: (y: number) => void
}

// URL-driven timeline state for the dedicated /timeline page: the year lives in
// the `?year=` search param; data shaping is delegated to useTimelineData.
export function useTimeline(): TimelineState {
  const [searchParams, setSearchParams] = useSearchParams()

  const rawYear = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
  const year = isNaN(rawYear) ? new Date().getFullYear() : rawYear

  const { laned, unscheduled, loading, error } = useTimelineData(year)

  function setYear(y: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('year', String(y))
      return next
    })
  }

  return { year, laned, unscheduled, loading, error, setYear }
}
