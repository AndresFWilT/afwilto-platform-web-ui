import { useState, useCallback } from 'react'
import { Text, Card, Alert, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { ActivityInput, CriticalPathResult } from '@/application/ports/ICriticalPathService'
import { ActivityInput as ActivityInputComponent } from './ActivityInput'
import { ScheduleTable } from './ScheduleTable'
import { NetworkGraph } from './NetworkGraph'

export function CriticalPathApp() {
  const { criticalPathService } = useServices()

  const [result, setResult]   = useState<CriticalPathResult | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCompute = useCallback(async (activities: ActivityInput[]) => {
    setLoading(true)
    setError(null)
    try {
      const r = await criticalPathService.compute(activities)
      setResult(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Computation failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [criticalPathService])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Text variant="h3" color="default">Critical Path Method</Text>
        <Badge variant="primary" size="sm">Live</Badge>
      </div>
      <Text variant="caption" color="muted">
        Enter project activities with durations and dependencies. CPM computes
        the critical path — the sequence of activities that determines the minimum project duration.
        Activities on the critical path have zero slack: any delay delays the whole project.
      </Text>

      <ActivityInputComponent disabled={loading} onCompute={handleCompute} />

      {error && (
        <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading && (
        <Card padding="md" className="flex items-center justify-center" style={{ height: 64 }}>
          <Spinner size="md" />
        </Card>
      )}

      {result && (
        <>
          <ScheduleTable result={result} />

          <Card
            padding="md"
            className="relative"
            style={{ backgroundColor: 'var(--color-brand-50)' }}
          >
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              <span>
                <span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ backgroundColor: '#f87171', verticalAlign: 'middle' }} />
                Critical activity / edge
              </span>
              <span>Top row: <span className="text-blue-700 font-mono">ES | Name | EF</span></span>
              <span>Bottom row: <span className="text-violet-700 font-mono">LS | d=dur | LF</span></span>
            </div>
            <NetworkGraph result={result} />
          </Card>
        </>
      )}
    </div>
  )
}
