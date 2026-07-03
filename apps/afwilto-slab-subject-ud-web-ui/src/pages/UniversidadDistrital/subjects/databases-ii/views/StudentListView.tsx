import { useEffect, useState } from 'react'
import { Card, Text, Spinner, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { Student } from '@/application/ports/ITheaterService'

export function StudentListView() {
  const { theaterService } = useServices()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    theaterService.listStudents()
      .then(setStudents)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load students'))
      .finally(() => setLoading(false))
  }, [theaterService])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-4">
      <Text variant="h4" color="default">Registered Students ({students.length})</Text>
      {error && <Alert variant="error" title="Error">{error}</Alert>}
      {students.length === 0 && !error && (
        <Text variant="body" color="muted">No students registered yet.</Text>
      )}
      <Card padding="none" className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border">
              <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Code</Text></th>
              <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Name</Text></th>
              <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">Email</Text></th>
              <th className="px-4 py-2 text-left"><Text variant="caption" color="muted">ID</Text></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.studentCode} className="border-b border-surface-border/40">
                <td className="px-4 py-2"><Text variant="mono" color="default">{s.studentCode}</Text></td>
                <td className="px-4 py-2"><Text variant="body" color="default">{s.firstName} {s.lastName}</Text></td>
                <td className="px-4 py-2"><Text variant="caption" color="muted">{s.email}</Text></td>
                <td className="px-4 py-2"><Text variant="caption" color="muted">{s.idNumber}</Text></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
