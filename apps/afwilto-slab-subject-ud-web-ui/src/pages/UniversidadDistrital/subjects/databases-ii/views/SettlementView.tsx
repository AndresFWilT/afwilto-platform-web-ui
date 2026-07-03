import { useEffect, useState } from 'react'
import { Card, Text, Button, Spinner, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthResult, SettlementData, Play } from '@/application/ports/ITheaterService'

interface Props { auth: AuthResult }

export function SettlementView({ auth }: Props) {
  const { theaterService } = useServices()
  const [plays, setPlays] = useState<Play[]>([])
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null)
  const [data, setData] = useState<SettlementData | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    theaterService.getTeacherPlays(auth.token)
      .then((all) => {
        setPlays(all)
        if (all.length > 0) setSelectedPlayId(all[0].playId)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plays'))
  }, [auth.token, theaterService])

  useEffect(() => {
    if (!selectedPlayId) return
    setLoading(true)
    setError(null)
    theaterService.getSettlement(selectedPlayId, auth.token)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load settlement'))
      .finally(() => setLoading(false))
  }, [selectedPlayId, auth.token, theaterService])

  const downloadPdf = async () => {
    if (!selectedPlayId) return
    setPdfLoading(true)
    try {
      const blob = await theaterService.generateSettlementPdf(selectedPlayId, auth.token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `settlement-${selectedPlayId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF generation failed')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Text variant="h4" color="default">Travel Expense Settlement</Text>
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

      {loading ? <div className="flex justify-center py-8"><Spinner size="lg" /></div> : data && (
        <>
          <Card padding="md" className="flex flex-col gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><Text variant="caption" color="muted">Play</Text><Text variant="body" color="default">{data.playTitle}</Text></div>
              <div><Text variant="caption" color="muted">Director</Text><Text variant="body" color="default">{data.employeeName}</Text></div>
              <div><Text variant="caption" color="muted">Faculty</Text><Text variant="body" color="default">{data.facultyName}</Text></div>
              <div><Text variant="caption" color="muted">Period</Text><Text variant="body" color="default">{data.startDate} – {data.endDate}</Text></div>
            </div>
          </Card>

          <Card padding="none" className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Code</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Name</Text></th>
                  <th className="px-4 py-2 text-right"><Text variant="caption" color="muted">Sessions</Text></th>
                  <th className="px-4 py-2 text-right"><Text variant="caption" color="muted">Hours</Text></th>
                  <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Term</Text></th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.studentCode} className="border-b border-surface-border/40">
                    <td className="px-4 py-2"><Text variant="mono" color="default">{e.studentCode}</Text></td>
                    <td className="px-4 py-2"><Text variant="body" color="default">{e.fullName}</Text></td>
                    <td className="px-4 py-2 text-right"><Text variant="mono" color="default">{e.sessionCount}</Text></td>
                    <td className="px-4 py-2 text-right"><Text variant="mono" color="default">{e.totalHours}</Text></td>
                    <td className="px-4 py-2"><Text variant="caption" color="muted">{e.termDescription}</Text></td>
                  </tr>
                ))}
                {data.entries.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center">
                    <Text variant="caption" color="muted">No entries.</Text>
                  </td></tr>
                )}
              </tbody>
            </table>
          </Card>

          <div className="flex justify-end">
            <Button variant="primary" disabled={pdfLoading} onClick={downloadPdf} loading={pdfLoading}>
              Download PDF Report
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
