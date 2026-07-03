import { useState } from 'react'
import { Card, Text, Button, FormField, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { StudentRegistration } from '@/application/ports/ITheaterService'

interface Props {
  onSuccess: () => void
}

export function StudentRegistrationView({ onSuccess }: Props) {
  const { theaterService } = useServices()
  const [form, setForm] = useState<StudentRegistration>({
    studentCode: '', idNumber: '', idType: 'C.C',
    firstName: '', lastName: '', email: '',
    birthDate: null, unitCode: 'DEPT_TEATRO',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (key: keyof StudentRegistration) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await theaterService.registerStudent(form)
      setSuccess(true)
      setTimeout(onSuccess, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Registered!">
        Student registered. An audition has been scheduled — check your email.
      </Alert>
    )
  }

  return (
    <Card padding="md" className="max-w-lg flex flex-col gap-4">
      <Text variant="h4" color="default">Register for Audition</Text>
      {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField id="firstName" label="First Name" value={form.firstName} onChange={set('firstName')} />
        <FormField id="lastName" label="Last Name" value={form.lastName} onChange={set('lastName')} />
        <FormField id="studentCode" label="Student Code" value={form.studentCode} onChange={set('studentCode')} />
        <FormField id="idNumber" label="ID Number" value={form.idNumber} onChange={set('idNumber')} />
        <div className="flex flex-col gap-1">
          <Text variant="caption" color="muted">ID Type</Text>
          <select
            value={form.idType}
            onChange={set('idType')}
            className="rounded-md border border-surface-border bg-surface-overlay px-3 py-2 text-sm text-neutral-100"
          >
            <option value="C.C">Cédula de Ciudadanía</option>
            <option value="T.I">Tarjeta de Identidad</option>
            <option value="CE">Cédula de Extranjería</option>
          </select>
        </div>
        <FormField id="email" label="Email" type="email" value={form.email} onChange={set('email')} />
        <FormField
          id="birthDate" label="Birth Date" type="date"
          value={form.birthDate ?? ''}
          onChange={(e) => setForm((p) => ({ ...p, birthDate: e.target.value || null }))}
        />
      </div>

      <Button variant="primary" disabled={loading || !form.firstName || !form.studentCode || !form.email} onClick={handleSubmit} loading={loading}>
        Register &amp; Schedule Audition
      </Button>
    </Card>
  )
}
