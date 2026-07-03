import { useState, useEffect, useCallback } from 'react'
import { Alert, Text, Spinner } from '@afwilto/design-system'
import { useServices } from '@/di'
import { CurrentReadingCard } from './CurrentReadingCard'
import { SummaryCards } from './SummaryCards'
import { TemperatureChart } from './TemperatureChart'
import { HumidityChart } from './HumidityChart'
import { DateRangePicker } from './DateRangePicker'
import { IngestSimulator } from './IngestSimulator'
import type { SensorReading, WeatherSummary, DateRange } from './types'

function todayRange(): DateRange {
  const now   = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return { from: start.toISOString(), to: now.toISOString() }
}

export function WeatherDashboard() {
  const { weatherStationService } = useServices()

  const [readings, setReadings]               = useState<SensorReading[]>([])
  const [latest, setLatest]                   = useState<SensorReading | null>(null)
  const [summary, setSummary]                 = useState<WeatherSummary | null>(null)
  const [dateRange, setDateRange]             = useState<DateRange>(todayRange)
  const [lastKnownTimestamp, setLastKnown]    = useState<string | null>(null)
  const [loadingData, setLoadingData]         = useState(false)
  const [loadingLatest, setLoadingLatest]     = useState(true)
  const [error, setError]                     = useState<string | null>(null)

  const fetchAll = useCallback(
    async (range: DateRange) => {
      setLoadingData(true)
      setError(null)
      try {
        const [readingsResult, summaryResult, latestResult] = await Promise.all([
          weatherStationService.queryReadings(range.from, range.to),
          weatherStationService.getSummary(range.from, range.to),
          weatherStationService.getLatest(),
        ])
        setReadings(readingsResult.readings)
        setSummary(summaryResult)
        setLatest(latestResult)
        if (latestResult) setLastKnown(latestResult.recordedAt)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load weather data')
      } finally {
        setLoadingData(false)
        setLoadingLatest(false)
      }
    },
    [weatherStationService],
  )

  useEffect(() => {
    fetchAll(dateRange)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const latestReading = await weatherStationService.getLatest()
        if (latestReading && latestReading.recordedAt !== lastKnownTimestamp) {
          setLastKnown(latestReading.recordedAt)
          fetchAll(dateRange)
        }
      } catch {
        // Polling failures are silent — the error banner covers manual reloads
      }
    }, 10_000)
    return () => clearInterval(interval)
  }, [lastKnownTimestamp, dateRange, weatherStationService, fetchAll])

  function handleRangeLoad(range: DateRange) {
    setDateRange(range)
    fetchAll(range)
  }

  function handleIngested() {
    fetchAll(dateRange)
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="error" title="Connection error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loadingLatest && !latest && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* ── Current reading ─────────────────────────────── */}
      <CurrentReadingCard reading={latest} loading={loadingLatest} />

      {/* ── Summary cards ───────────────────────────────── */}
      {summary && summary.count > 0 && (
        <div className="flex flex-col gap-2">
          <Text variant="small" color="muted" weight="medium">
            Summary — {summary.count} reading{summary.count !== 1 ? 's' : ''}
          </Text>
          <SummaryCards summary={summary} />
        </div>
      )}

      {/* ── Date range picker ───────────────────────────── */}
      <DateRangePicker range={dateRange} loading={loadingData} onLoad={handleRangeLoad} />

      {/* ── Charts ──────────────────────────────────────── */}
      {loadingData ? (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <TemperatureChart readings={readings} />
          <HumidityChart readings={readings} />
        </div>
      )}

      {/* ── Ingest simulator ────────────────────────────── */}
      <IngestSimulator onIngested={handleIngested} />
    </div>
  )
}
