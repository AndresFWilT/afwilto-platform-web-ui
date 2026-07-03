import { useEffect, useState } from 'react'
import { Card, Text, Badge, Spinner, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { Play } from '@/application/ports/ITheaterService'

export function PlayListView() {
  const { theaterService } = useServices()
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    theaterService.listPlays()
      .then(setPlays)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plays'))
      .finally(() => setLoading(false))
  }, [theaterService])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-4">
      <Text variant="h4" color="default">Current Plays</Text>
      {error && <Alert variant="error" title="Error">{error}</Alert>}
      {plays.length === 0 && !error && (
        <Text variant="body" color="muted">No plays found.</Text>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plays.map((play) => (
          <Card key={play.playId} padding="md" className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <Text variant="h4" color="default">{play.title}</Text>
              <Badge variant={play.isActive ? 'success' : 'neutral'} size="sm">
                {play.isActive ? 'Active' : 'Closed'}
              </Badge>
            </div>
            <Text variant="caption" color="muted">ID: {play.playId}</Text>
          </Card>
        ))}
      </div>
    </div>
  )
}
