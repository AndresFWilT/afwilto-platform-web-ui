import { useEffect, useState } from 'react'
import { Card, Text, Button, Badge, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import type { AuthResult, Play } from '@/application/ports/ITheaterService'
import type { TeacherView } from '../types'

interface Props {
  auth: AuthResult
  onNavigate: (view: TeacherView) => void
}

export function TeacherDashboardView({ auth, onNavigate }: Props) {
  const { theaterService } = useServices()
  const [plays, setPlays] = useState<Play[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    theaterService.getTeacherPlays(auth.token)
      .then(setPlays)
      .catch(() => setPlays([]))
      .finally(() => setLoading(false))
  }, [auth.token, theaterService])

  const activePlay = plays.find((p) => p.isActive)

  return (
    <div className="flex flex-col gap-6">
      <Card padding="md" className="flex flex-col gap-2">
        <Text variant="h4" color="default">Welcome, {auth.fullName}</Text>
        <Text variant="caption" color="muted">{auth.email}</Text>
        {loading ? <Spinner size="sm" /> : (
          <div className="flex items-center gap-2 mt-1">
            <Text variant="small" color="muted">Active play:</Text>
            {activePlay
              ? <Badge variant="success" size="sm">{activePlay.title}</Badge>
              : <Badge variant="neutral" size="sm">No active play</Badge>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="📋"
          title="Attendance"
          description="Mark student attendance for today's function."
          variant="primary"
          disabled={!activePlay}
          onClick={() => onNavigate('attendance')}
        />
        <DashboardCard
          icon="💰"
          title="Settlement"
          description="View travel expense liquidation and generate PDF report."
          variant="secondary"
          disabled={!activePlay}
          onClick={() => onNavigate('settlement')}
        />
        <DashboardCard
          icon="🎓"
          title="Certificates"
          description="Issue participation certificates to students."
          variant="ghost"
          disabled={plays.length === 0}
          onClick={() => onNavigate('certificates')}
        />
      </div>
    </div>
  )
}

function DashboardCard({ icon, title, description, variant, disabled, onClick }: {
  icon: string; title: string; description: string
  variant: 'primary' | 'secondary' | 'ghost'
  disabled: boolean; onClick: () => void
}) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <span className="text-3xl">{icon}</span>
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">{title}</Text>
        <Text variant="caption" color="muted">{description}</Text>
      </div>
      <Button variant={variant} size="sm" disabled={disabled} onClick={onClick}>
        Open {title}
      </Button>
    </Card>
  )
}
