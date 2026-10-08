import { useEffect, useState } from 'react'
import { useServices } from '@/di'
import { assignLanes, type LanedItem } from '@/domain/timeline'
import type { Certification } from '@/application/ports'

export interface TimelineData {
  laned: LanedItem[]
  unscheduled: Certification[]
  loading: boolean
  error: Error | null
}

// Fetches every certification (up to a page of 100) and shapes it into lanes for
// an explicit year. Decoupled from URL state so it can back both the dedicated
// timeline page and the landing-page overview.
export function useTimelineData(year: number): TimelineData {
  const { certificationJourneyService } = useServices()

  const [laned, setLaned] = useState<LanedItem[]>([])
  const [unscheduled, setUnscheduled] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    certificationJourneyService
      .list({ page: 1, pageSize: 100 })
      .then((page) => {
        if (cancelled) return
        const noDate = page.items.filter(
          (c) => !c.studyStartDate && !c.expectedExamDate && !c.achievedDate,
        )
        setLaned(assignLanes(page.items, year))
        setUnscheduled(noDate)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [year])

  return { laned, unscheduled, loading, error }
}
