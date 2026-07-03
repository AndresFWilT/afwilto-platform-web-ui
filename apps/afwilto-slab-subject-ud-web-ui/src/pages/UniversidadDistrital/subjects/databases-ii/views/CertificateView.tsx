import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Alert, FormField } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthResult, Play } from '@/application/ports/ITheaterService'

interface Props { auth: AuthResult }

export function CertificateView({ auth }: Props) {
  const { theaterService } = useServices()
  const [plays, setPlays] = useState<Play[]>([])
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null)
  const [studentCode, setStudentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    theaterService.getTeacherPlays(auth.token)
      .then((all) => {
        setPlays(all)
        if (all.length > 0) setSelectedPlayId(all[0].playId)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plays'))
  }, [auth.token, theaterService])

  const certifyAll = async () => {
    if (!selectedPlayId) return
    setLoading(true)
    setError(null)
    try {
      await theaterService.issueCertificatesForPlay(selectedPlayId, auth.token)
      setNotice('Certificates issued and emailed to all students in the play.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue certificates')
    } finally {
      setLoading(false)
    }
  }

  const certifyOne = async () => {
    if (!selectedPlayId || !studentCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      await theaterService.issueCertificateForStudent(selectedPlayId, studentCode.trim(), auth.token)
      setNotice(`Certificate issued and emailed to student ${studentCode}.`)
      setStudentCode('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to issue certificate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Text variant="h4" color="default">Certificates</Text>

      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert variant="success" title="Done" onClose={() => setNotice(null)}>{notice}</Alert>}

      <Card padding="md" className="flex flex-col gap-4">
        <Text variant="h4" color="default">Issue Certificates for Play</Text>
        {plays.length > 0 && (
          <div className="flex flex-col gap-2">
            <Text variant="caption" color="muted">Select play</Text>
            <select
              value={selectedPlayId ?? ''}
              onChange={(e) => setSelectedPlayId(e.target.value)}
              className="rounded-md border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-neutral-100 w-full max-w-xs"
            >
              {plays.map((p) => <option key={p.playId} value={p.playId}>{p.title}</option>)}
            </select>
          </div>
        )}
        <Button variant="primary" size="sm" disabled={loading || !selectedPlayId} onClick={certifyAll} loading={loading}>
          Issue to All Students in Play
        </Button>
      </Card>

      <Card padding="md" className="flex flex-col gap-4">
        <Text variant="h4" color="default">Issue Certificate to One Student</Text>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <FormField
              id="studentCode" label="Student Code"
              placeholder="e.g. 20201020"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && certifyOne()}
            />
          </div>
          <Button variant="secondary" size="sm" disabled={loading || !studentCode.trim() || !selectedPlayId} onClick={certifyOne}>
            Issue Certificate
          </Button>
        </div>
      </Card>

      {loading && <div className="flex justify-center"><Spinner size="md" /></div>}
    </div>
  )
}
