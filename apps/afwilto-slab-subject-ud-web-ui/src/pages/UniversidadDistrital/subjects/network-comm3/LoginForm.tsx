import { useState } from 'react'
import { Button, FormField, Alert, Text, Card } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthState } from './types'

interface Props {
  onLogin: (auth: AuthState) => void
}

export function LoginForm({ onLogin }: Props) {
  const { mailClientService } = useServices()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [server,   setServer]   = useState('localhost')
  const [smtpPort, setSmtpPort] = useState('25')
  const [pop3Port, setPop3Port] = useState('110')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleConnect() {
    if (!username.trim() || !password) { setError('Username and password are required.'); return }
    setLoading(true); setError(null)
    try {
      const result = await mailClientService.authenticate(
        username.trim(), password, server.trim(),
        parseInt(smtpPort) || 25, parseInt(pop3Port) || 110, false,
      )
      onLogin({ token: result.token, username: result.username, email: result.email, expiresAt: result.expiresAt })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card padding="lg" className="w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Text variant="h3" color="default">Mail Client</Text>
          <Text variant="caption" color="muted">SMTP + POP3 — Network Communications III</Text>
        </div>

        {error && <Alert variant="error" title="Connection error" onClose={() => setError(null)}>{error}</Alert>}

        <FormField label="Username" id="mc-user" value={username}
          onChange={e => setUsername(e.target.value)} inputSize="md" />

        <FormField label="Password" id="mc-pass" type="password" value={password}
          onChange={e => setPassword(e.target.value)} inputSize="md" />

        <FormField label="Mail server (host)" id="mc-server" value={server}
          onChange={e => setServer(e.target.value)} inputSize="sm"
          helperText="Shared hostname for SMTP and POP3" />

        <div className="flex gap-3">
          <FormField label="SMTP port" id="mc-smtp" type="number" value={smtpPort}
            onChange={e => setSmtpPort(e.target.value)} inputSize="sm" className="flex-1" />
          <FormField label="POP3 port" id="mc-pop3" type="number" value={pop3Port}
            onChange={e => setPop3Port(e.target.value)} inputSize="sm" className="flex-1" />
        </div>

        <Button variant="primary" size="md" loading={loading} onClick={handleConnect} fullWidth>
          Connect
        </Button>
      </Card>
    </div>
  )
}
