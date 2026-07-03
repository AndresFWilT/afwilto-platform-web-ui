export interface EmailMessage {
  id: number
  from: string
  to: string
  subject: string
  date: string
  bodyPreview: string
  body?: string
}

export interface AuthResult {
  token: string
  username: string
  email: string
  expiresAt: string
}

export interface IMailClientService {
  authenticate(
    username: string,
    password: string,
    server: string,
    smtpPort: number,
    pop3Port: number,
    tls: boolean,
  ): Promise<AuthResult>
  sendMessage(token: string, to: string, subject: string, body: string): Promise<void>
  listMessages(token: string): Promise<{ messages: EmailMessage[]; totalCount: number }>
  getMessage(token: string, id: number): Promise<EmailMessage>
}
