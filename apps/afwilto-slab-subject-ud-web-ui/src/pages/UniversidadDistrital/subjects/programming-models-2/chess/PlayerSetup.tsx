import { useState } from 'react'
import { Text, Button, Card } from '@afwilto/design-system'
import { Input } from '@afwilto/design-system'

interface Props {
  onStart: (white: string, black: string) => void
  loading: boolean
  error: string | null
}

export function PlayerSetup({ onStart, loading, error }: Props) {
  const [white, setWhite] = useState('Player 1')
  const [black, setBlack] = useState('Player 2')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const w = white.trim() || 'Player 1'
    const b = black.trim() || 'Player 2'
    onStart(w, b)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-6">
      <div className="flex flex-col gap-1 text-center">
        <Text variant="h3" color="default">Chess</Text>
        <Text variant="body" color="muted">Two-player. Backend enforces all rules.</Text>
      </div>

      <Card padding="lg" className="w-full max-w-sm flex flex-col gap-4">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-neutral-400" style={{ backgroundColor: '#f0d9b5' }} />
              <Text variant="small" color="muted">White player</Text>
            </div>
            <Input
              value={white}
              onChange={e => setWhite(e.target.value)}
              placeholder="Player 1"
              inputSize="md"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-neutral-400" style={{ backgroundColor: '#202020' }} />
              <Text variant="small" color="muted">Black player</Text>
            </div>
            <Input
              value={black}
              onChange={e => setBlack(e.target.value)}
              placeholder="Player 2"
              inputSize="md"
            />
          </div>

          {error && (
            <Text variant="caption" color="default" className="text-error-400">{error}</Text>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Start Game
          </Button>
        </form>
      </Card>
    </div>
  )
}
