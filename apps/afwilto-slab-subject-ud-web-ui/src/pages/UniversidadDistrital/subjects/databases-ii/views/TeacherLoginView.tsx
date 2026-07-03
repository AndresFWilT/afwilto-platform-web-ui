import { useState } from 'react'
import { Card, Text, Button, FormField, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthResult } from '@/application/ports/ITheaterService'

interface Props {
  onLogin: (auth: AuthResult) => void
}

export function TeacherLoginView({ onLogin }: Props) {
  const { theaterService } = useServices()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const auth = await theaterService.login(email, password)
      onLogin(auth)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-6">
      <Card padding="md" className="w-full max-w-sm flex flex-col gap-4">
        <Text variant="h4" color="default">Teacher Login</Text>
        <Text variant="caption" color="muted">
          Access the attendance, settlement, and certificate management tools.
        </Text>
        {error && <Alert variant="error" title="Login failed" onClose={() => setError(null)}>{error}</Alert>}
        <FormField id="email" label="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()} />
        <FormField id="password" label="Password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()} />
        <Button variant="primary" disabled={loading || !email || !password} onClick={handleLogin} loading={loading}>
          Login
        </Button>
      </Card>
    </div>
  )
}
