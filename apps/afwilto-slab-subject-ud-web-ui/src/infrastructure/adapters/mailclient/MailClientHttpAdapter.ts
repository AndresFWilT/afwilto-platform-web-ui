import type { IHttpClient } from '@/application/ports'
import type {
  IMailClientService,
  AuthResult,
  EmailMessage,
} from '@/application/ports/IMailClientService'

type ApiResponse<T> = { data: T }

export class MailClientHttpAdapter implements IMailClientService {
  private readonly http: IHttpClient
  constructor(http: IHttpClient) {
    this.http = http
  }

  async authenticate(
    username: string,
    password: string,
    server: string,
    smtpPort: number,
    pop3Port: number,
    tls: boolean,
  ): Promise<AuthResult> {
    try {
      const res = await this.http.post<ApiResponse<AuthResult>>(
        '/api/v1/mail/authenticate',
        { username, password, server, smtpPort, pop3Port, tls },
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async sendMessage(token: string, to: string, subject: string, body: string): Promise<void> {
    try {
      await this.http.post<ApiResponse<{ sent: boolean }>>(
        '/api/v1/mail/messages/send',
        { to, subject, body },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (e) {
      throw translate(e)
    }
  }

  async listMessages(token: string): Promise<{ messages: EmailMessage[]; totalCount: number }> {
    try {
      const res = await this.http.get<ApiResponse<{ messages: EmailMessage[]; totalCount: number }>>(
        '/api/v1/mail/messages',
        { headers: { Authorization: `Bearer ${token}` } },
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }

  async getMessage(token: string, id: number): Promise<EmailMessage> {
    try {
      const res = await this.http.get<ApiResponse<EmailMessage>>(
        `/api/v1/mail/messages/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      return res.data
    } catch (e) {
      throw translate(e)
    }
  }
}

function translate(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('AUTH_FAILED'))    return new Error('Authentication failed — check your credentials.')
  if (m.includes('POP3_ERROR'))     return new Error('Cannot reach the mail server via POP3. Check the server address and port.')
  if (m.includes('SMTP_ERROR'))     return new Error('Cannot send email via SMTP. Check the server address and port.')
  if (m.includes('TOKEN_EXPIRED'))  return new Error('Session expired — please log in again.')
  if (m.includes('INVALID_TOKEN'))  return new Error('Invalid session — please log in again.')
  if (m.includes('INVALID_RECIPIENT')) return new Error('The recipient email address is invalid.')
  if (m.includes('Failed to fetch') || m.includes('NetworkError')) {
    return new Error('Cannot reach the backend — is network-communication-mngr running on :8086?')
  }
  return e
}
