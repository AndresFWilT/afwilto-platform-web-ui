import type { IHttpClient } from '@/application/ports'
import type {
  ITheaterService,
  Play, PlayFunction, Student, StudentAttendanceStatus,
  SettlementData, AuthResult, StudentRegistration, AttendanceMark, BulkAttendanceMark,
} from '@/application/ports/ITheaterService'

type Envelope<T> = { data: T }

export class TheaterHttpAdapter implements ITheaterService {
  private readonly http: IHttpClient
  private readonly baseUrl: string
  constructor(http: IHttpClient, baseUrl: string) {
    this.http = http
    this.baseUrl = baseUrl
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await this.http.post<Envelope<AuthResult>>('/api/v1/auth/login', { email, password })
      return res.data
    } catch (e) {
      throw translateAuth(e)
    }
  }

  async listPlays(): Promise<Play[]> {
    try {
      const res = await this.http.get<Envelope<Play[]>>('/api/v1/plays')
      return res.data
    } catch (e) { throw translateGeneric(e) }
  }

  async getPlay(id: string): Promise<Play> {
    try {
      const res = await this.http.get<Envelope<Play>>(`/api/v1/plays/${id}`)
      return res.data
    } catch (e) { throw translateGeneric(e) }
  }

  async getPlayFunctions(playId: string): Promise<PlayFunction[]> {
    try {
      const res = await this.http.get<Envelope<PlayFunction[]>>(`/api/v1/plays/${playId}/functions`)
      return res.data
    } catch (e) { throw translateGeneric(e) }
  }

  async listStudents(): Promise<Student[]> {
    try {
      const res = await this.http.get<Envelope<Student[]>>('/api/v1/students')
      return res.data
    } catch (e) { throw translateGeneric(e) }
  }

  async registerStudent(data: StudentRegistration): Promise<void> {
    try {
      await this.http.post('/api/v1/students', data)
    } catch (e) { throw translateStudent(e) }
  }

  async getPlayAttendance(playId: string, token: string): Promise<StudentAttendanceStatus[]> {
    try {
      const res = await this.http.get<Envelope<StudentAttendanceStatus[]>>(
        `/api/v1/plays/${playId}/attendance`, { headers: auth(token) }
      )
      return res.data
    } catch (e) { throw translateAuth(e) }
  }

  async markAttendance(data: AttendanceMark, token: string): Promise<void> {
    try {
      await this.http.post('/api/v1/attendance', data, { headers: auth(token) })
    } catch (e) { throw translateGeneric(e) }
  }

  async markBulkAttendance(data: BulkAttendanceMark, token: string): Promise<void> {
    try {
      await this.http.post('/api/v1/attendance/bulk', data, { headers: auth(token) })
    } catch (e) { throw translateGeneric(e) }
  }

  async getSettlement(playId: string, token: string): Promise<SettlementData> {
    try {
      const res = await this.http.get<Envelope<SettlementData>>(
        `/api/v1/plays/${playId}/settlement`, { headers: auth(token) }
      )
      return res.data
    } catch (e) { throw translateGeneric(e) }
  }

  async generateSettlementPdf(playId: string, token: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/v1/plays/${playId}/settlement/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Failed to generate settlement PDF')
    return response.blob()
  }

  async getTeacherPlays(token: string): Promise<Play[]> {
    try {
      const res = await this.http.get<Envelope<Play[]>>(
        '/api/v1/employees/me/plays', { headers: auth(token) }
      )
      return res.data
    } catch (e) { throw translateAuth(e) }
  }

  async issueCertificatesForPlay(playId: string, token: string): Promise<void> {
    try {
      await this.http.post(`/api/v1/certificates/play/${playId}`, {}, { headers: auth(token) })
    } catch (e) { throw translateGeneric(e) }
  }

  async issueCertificateForStudent(playId: string, studentCode: string, token: string): Promise<void> {
    try {
      await this.http.post('/api/v1/certificates/student', { playId, studentCode }, { headers: auth(token) })
    } catch (e) { throw translateGeneric(e) }
  }
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

function translateAuth(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('401')) return new Error('Invalid email or password')
  if (m.includes('404')) return new Error('Employee not found')
  if (m.includes('Failed to fetch') || m.includes('NetworkError'))
    return new Error('Cannot reach the backend — is theater-mngr running on :8085?')
  return e
}

function translateStudent(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('409')) return new Error('A student with this code is already registered')
  if (m.includes('Failed to fetch') || m.includes('NetworkError'))
    return new Error('Cannot reach the backend — is theater-mngr running on :8085?')
  return e
}

function translateGeneric(e: unknown): Error {
  if (!(e instanceof Error)) return new Error('Unexpected error')
  const m = e.message
  if (m.includes('Failed to fetch') || m.includes('NetworkError'))
    return new Error('Cannot reach the backend — is theater-mngr running on :8085?')
  if (m.includes('404')) return new Error('Resource not found')
  return e
}
