import { useState } from 'react'
import { Text, Button, Card, Input } from '@afwilto/design-system'

interface Props {
  onStart: (players: string[]) => void
  loading: boolean
  error: string | null
}

export function PlayerSetup({ onStart, loading, error }: Props) {
  const [p1, setP1] = useState('Player 1')
  const [p2, setP2] = useState('Player 2')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onStart([p1.trim() || 'Player 1', p2.trim() || 'Player 2'])
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Text variant="h3" color="default">Scrabble</Text>
        <Text variant="body" color="muted">Spanish tile distribution · 15×15 board · All rules enforced.</Text>
      </div>

      <Card padding="lg" className="w-full max-w-sm flex flex-col gap-4">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text variant="caption" color="muted">Player 1</Text>
            <Input value={p1} onChange={e => setP1(e.target.value)} placeholder="Player 1" inputSize="md" />
          </div>
          <div className="flex flex-col gap-1">
            <Text variant="caption" color="muted">Player 2</Text>
            <Input value={p2} onChange={e => setP2(e.target.value)} placeholder="Player 2" inputSize="md" />
          </div>
          {error && <Text variant="caption" color="default" className="text-error-400">{error}</Text>}
          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Start Game
          </Button>
        </form>
      </Card>
    </div>
  )
}
