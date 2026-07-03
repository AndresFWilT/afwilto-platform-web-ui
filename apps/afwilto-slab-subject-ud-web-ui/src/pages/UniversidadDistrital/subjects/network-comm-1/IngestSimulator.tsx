import { useState } from 'react'
import { Button, FormField, Alert, Text, Card } from '@afwilto/design-system'
import { useServices } from '@/di'

interface Props {
  onIngested: () => void
}

export function IngestSimulator({ onIngested }: Props) {
  const { weatherStationService } = useServices()
  const [temperature, setTemperature] = useState('')
  const [humidity, setHumidity]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  async function handleSend() {
    const temp = parseFloat(temperature)
    const hum  = parseFloat(humidity)

    if (isNaN(temp) || isNaN(hum)) {
      setError('Both fields must be valid numbers.')
      return
    }
    if (temp < -50 || temp > 60) {
      setError('Temperature must be between -50 and 60°C.')
      return
    }
    if (hum < 0 || hum > 100) {
      setError('Humidity must be between 0 and 100%.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await weatherStationService.ingestReading(temp, hum)
      setSuccess(true)
      setTemperature('')
      setHumidity('')
      onIngested()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="md" className="flex flex-col gap-3">
      <Text as="h3" variant="h4" color="muted">Ingest Simulator</Text>
      <Text variant="caption" color="muted">
        Simulates what an ESP-32 with DHT11 would send.
      </Text>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <FormField
          label="Temperature (°C)"
          id="sim-temperature"
          type="number"
          placeholder="-50 to 60"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          inputSize="sm"
          className="flex-1"
        />
        <FormField
          label="Humidity (%)"
          id="sim-humidity"
          type="number"
          placeholder="0 to 100"
          value={humidity}
          onChange={(e) => setHumidity(e.target.value)}
          inputSize="sm"
          className="flex-1"
        />
        <Button variant="secondary" size="sm" loading={loading} onClick={handleSend}>
          Send Reading
        </Button>
      </div>

      {error   && <Alert variant="error"   title="Error">{error}</Alert>}
      {success && <Alert variant="success" title="Sent">Reading ingested successfully.</Alert>}
    </Card>
  )
}
