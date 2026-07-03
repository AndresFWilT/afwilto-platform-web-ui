import { useState } from 'react'
import { Text, Button, Badge } from '@afwilto/design-system'
import type { AuthResult } from '@/application/ports/ITheaterService'
import type { AppView, TeacherView } from './types'
import { PlayListView } from './views/PlayListView'
import { StudentListView } from './views/StudentListView'
import { StudentRegistrationView } from './views/StudentRegistrationView'
import { TeacherLoginView } from './views/TeacherLoginView'
import { TeacherDashboardView } from './views/TeacherDashboardView'
import { AttendanceView } from './views/AttendanceView'
import { SettlementView } from './views/SettlementView'
import { CertificateView } from './views/CertificateView'

// ── Navigation tab definition ─────────────────────────────────────────────────

const PUBLIC_TABS: { view: AppView; label: string }[] = [
  { view: 'plays', label: 'Plays' },
  { view: 'students', label: 'Students' },
  { view: 'register', label: 'Register' },
]

const TEACHER_TABS: { view: TeacherView; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'attendance', label: 'Attendance' },
  { view: 'settlement', label: 'Settlement' },
  { view: 'certificates', label: 'Certificates' },
]

// ── TheaterApp — internal composition root for all theater views ──────────────

export function TheaterApp() {
  const [view, setView] = useState<AppView>('plays')
  const [auth, setAuth] = useState<AuthResult | null>(null)

  const handleLogin = (result: AuthResult) => {
    setAuth(result)
    setView('dashboard')
  }

  const handleLogout = () => {
    setAuth(null)
    setView('plays')
  }

  const publicTabs = [...PUBLIC_TABS, ...(auth ? [] : [{ view: 'login' as AppView, label: 'Teacher Login' }])]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Text variant="h3" color="default">TeatrosUD</Text>
          <Badge variant="warning" size="sm">Databases II</Badge>
        </div>
        {auth && (
          <div className="flex items-center gap-3">
            <Text variant="caption" color="muted">{auth.fullName}</Text>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-1 border-b border-surface-border pb-2">
        {(auth ? TEACHER_TABS : publicTabs).map((tab) => (
          <button
            key={tab.view}
            onClick={() => setView(tab.view)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === tab.view
                ? 'bg-primary-500 text-white'
                : 'text-neutral-400 hover:text-neutral-100 hover:bg-surface-overlay'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'plays'        && <PlayListView />}
      {view === 'students'     && <StudentListView />}
      {view === 'register'     && <StudentRegistrationView onSuccess={() => setView('students')} />}
      {view === 'login'        && <TeacherLoginView onLogin={handleLogin} />}
      {auth && view === 'dashboard'    && <TeacherDashboardView auth={auth} onNavigate={(v) => setView(v)} />}
      {auth && view === 'attendance'   && <AttendanceView auth={auth} />}
      {auth && view === 'settlement'   && <SettlementView auth={auth} />}
      {auth && view === 'certificates' && <CertificateView auth={auth} />}
    </div>
  )
}
