// ── Reference types ────────────────────────────────────────────────────────────

export interface Play {
  playId: string
  title: string
  isActive: boolean
  playwrightId: number | null
  playTypeId: number | null
}

export interface PlayFunction {
  functionId: number
  playId: string
  theaterId: number | null
  modalityId: number | null
  functionDate: string
  startTime: string
  endTime: string
}

export interface Student {
  studentCode: string
  idNumber: string
  idType: string
  firstName: string
  lastName: string
  email: string
  unitCode: string | null
}

export interface StudentAttendanceStatus {
  studentCode: string
  fullName: string
  email: string
  unitName: string
  hasAttended: boolean
}

export interface SettlementEntry {
  studentCode: string
  fullName: string
  email: string
  sessionCount: number
  totalHours: number
  termDescription: string
}

export interface SettlementData {
  playId: string
  playTitle: string
  employeeName: string
  employeeIdNumber: string
  facultyName: string
  startDate: string
  endDate: string
  entries: SettlementEntry[]
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthResult {
  token: string
  employeeCode: string
  fullName: string
  email: string
}

// ── Commands ───────────────────────────────────────────────────────────────────

export interface StudentRegistration {
  studentCode: string
  idNumber: string
  idType: string
  firstName: string
  lastName: string
  email: string
  birthDate: string | null
  unitCode: string
}

export interface AttendanceMark {
  studentCode: string
  playId: string
  functionId: number
}

export interface BulkAttendanceMark {
  playId: string
  functionId: number
}

// ── Port ───────────────────────────────────────────────────────────────────────

export interface ITheaterService {
  // Public
  login(email: string, password: string): Promise<AuthResult>
  listPlays(): Promise<Play[]>
  getPlay(id: string): Promise<Play>
  getPlayFunctions(playId: string): Promise<PlayFunction[]>
  listStudents(): Promise<Student[]>
  registerStudent(data: StudentRegistration): Promise<void>

  // Authenticated
  getPlayAttendance(playId: string, token: string): Promise<StudentAttendanceStatus[]>
  markAttendance(data: AttendanceMark, token: string): Promise<void>
  markBulkAttendance(data: BulkAttendanceMark, token: string): Promise<void>
  getSettlement(playId: string, token: string): Promise<SettlementData>
  generateSettlementPdf(playId: string, token: string): Promise<Blob>
  getTeacherPlays(token: string): Promise<Play[]>
  issueCertificatesForPlay(playId: string, token: string): Promise<void>
  issueCertificateForStudent(playId: string, studentCode: string, token: string): Promise<void>
}
