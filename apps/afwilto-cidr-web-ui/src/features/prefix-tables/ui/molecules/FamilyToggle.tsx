import { Button } from '@afwilto/design-system'
import type { IpFamily } from '@/cidr/domain/types'

const FAMILIES: Array<{ family: IpFamily; label: string }> = [
  { family: 'ipv4', label: 'IPv4' },
  { family: 'ipv6', label: 'IPv6' },
]

export function FamilyToggle({ value, onChange }: { value: IpFamily; onChange: (family: IpFamily) => void }) {
  return (
    <div role="group" aria-label="IP family" className="flex gap-2">
      {FAMILIES.map(({ family, label }) => (
        <Button
          key={family}
          type="button"
          size="sm"
          variant={family === value ? 'primary' : 'secondary'}
          aria-pressed={family === value}
          onClick={() => onChange(family)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
