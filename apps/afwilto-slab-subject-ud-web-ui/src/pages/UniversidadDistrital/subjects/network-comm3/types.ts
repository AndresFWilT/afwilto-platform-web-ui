export type { EmailMessage, AuthResult } from '@/application/ports/IMailClientService'

export interface AuthState {
  token: string
  username: string
  email: string
  expiresAt: string
}
