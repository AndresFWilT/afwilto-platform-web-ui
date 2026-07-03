import type { AuthResult } from '@/application/ports/ITheaterService'

export type PublicView = 'plays' | 'students' | 'register' | 'login'
export type TeacherView = 'dashboard' | 'attendance' | 'settlement' | 'certificates'
export type AppView = PublicView | TeacherView

export interface Session {
  auth: AuthResult
  activePlays: string[]
}
