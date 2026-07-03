import { useEffect, useState, useCallback } from 'react'
import { Card, Text, Button, Spinner, Alert, Badge } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthResult, StudentAttendanceStatus, Play } from '@/application/ports/ITheaterService'

interface Props {
  auth: AuthResult
}

export function AttendanceView({ auth }: Props) {
  const { theaterService } = useServices()
  const [plays, setPlays] = useState<Play[]>([])
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentAttendanceStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    theaterService.getTeacherPlays(auth.token)
      .then((all) => {
        const active = all.filter((p) => p.isActive)
        setPlays(active)
        if (active.length > 0) setSelectedPlayId(active[0].playId)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plays'))
  }, [auth.token, theaterService])

  const loadAttendance = useCallback(async (playId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await theaterService.getPlayAttendance(playId, auth.token)
      setStudents(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [auth.token, theaterService])

  useEffect(() => {
    if (selectedPlayId) loadAttendance(selectedPlayId)
  }, [selectedPlayId, loadAttendance])

  const markOne = async (studentCode: string) => {
    if (!selectedPlayId) return
    setActionLoading(true)
    try {
      await theaterService.markAttendance({ studentCode, playId: selectedPlayId, functionId: 1 }, auth.token)
      setNotice(`Attendance marked for student ${studentCode}`)
      await loadAttendance(selectedPlayId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark attendance')
    } finally {
      setActionLoading(false)
    }
  }

  const markAll = async () => {
    if (!selectedPlayId) return
    setActionLoading(true)
    try {
      await theaterService.markBulkAttendance({ playId: selectedPlayId, functionId: 1 }, auth.token)
      setNotice('All attendance marked')
      await loadAttendance(selectedPlayId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to mark bulk attendance')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Text variant="h4" color="default">Attendance</Text>
        {plays.length > 1 && (
          <select
            value={selectedPlayId ?? ''}
            onChange={(e) => setSelectedPlayId(e.target.value)}
            className="rounded-md border border-surface-border bg-surface-overlay px-3 py-1.5 text-sm text-neutral-100"
          >
            {plays.map((p) => <option key={p.playId} value={p.playId}>{p.title}</option>)}
          </select>
        )}
      </div>

      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert variant="success" title="Done" onClose={() => setNotice(null)}>{notice}</Alert>}

      {loading ? <div className="flex justify-center py-8"><Spinner size="lg" /></div> : (
        <>
          {students.length > 0 && (
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" disabled={actionLoading} onClick={markAll}>
                Mark All Present
              </Button>
            </div>
          )}
          <Card padding="none" className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Code</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Name</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Email</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Status</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Action</Text></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.studentCode} className="border-b border-surface-border/40">
                    <td className="px-4 py-2"><Text variant="mono" color="default">{s.studentCode}</Text></td>
                    <td className="px-4 py-2"><Text variant="body" color="default">{s.fullName}</Text></td>
                    <td className="px-4 py-2"><Text variant="caption" color="muted">{s.email}</Text></td>
                    <td className="px-4 py-2">
                      <Badge variant={s.hasAttended ? 'success' : 'neutral'} size="sm">
                        {s.hasAttended ? 'Present' : 'Absent'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost" size="sm"
                        disabled={s.hasAttended || actionLoading}
                        onClick={() => markOne(s.studentCode)}
                      >
                        Mark
                      </Button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center">
                    <Text variant="caption" color="muted">No students in this play.</Text>
                  </td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
