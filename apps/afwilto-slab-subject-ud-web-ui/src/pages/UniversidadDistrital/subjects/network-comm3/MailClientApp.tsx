import { useState } from 'react'
import { LoginForm } from './LoginForm'
import { MailLayout } from './MailLayout'
import type { AuthState } from './types'

export function MailClientApp() {
  const [auth, setAuth] = useState<AuthState | null>(null)

  if (!auth) {
    return <LoginForm onLogin={setAuth} />
  }

  return <MailLayout auth={auth} onLogout={() => setAuth(null)} />
}
