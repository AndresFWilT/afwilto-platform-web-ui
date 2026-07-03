import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import { ProcessInput } from './ProcessInput'
import { QueueVisualizer } from './QueueVisualizer'
import { BlockedQueuePanel } from './BlockedQueuePanel'
import { GanttChart } from './GanttChart'
import { MetricsTable } from './MetricsTable'
import { ExecutionLog } from './ExecutionLog'
import type { ProcessRow, SchedulerState, SimulateResponse } from './types'

const DEFAULT_ROWS: ProcessRow[] = [
  { id: 1, pid: '1', burstTime: '8' },
  { id: 2, pid: '2', burstTime: '3' },
  { id: 3, pid: '3', burstTime: '12' },
]

type Mode = 'idle' | 'simulate' | 'step'

export function RoundRobinPage() {
  const { roundRobinService } = useServices()

  const [rows, setRows] = useState<ProcessRow[]>(DEFAULT_ROWS)
  const [nextId, setNextId] = useState(4)
  const [timeQuantum, setTimeQuantum] = useState(5)

  const [mode, setMode] = useState<Mode>('idle')
  const [simulateResult, setSimulateResult] = useState<SimulateResponse | null>(null)
  const [stepState, setStepState] = useState<SchedulerState | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(800)

  const stepStateRef = useRef(stepState)
  useEffect(() => { stepStateRef.current = stepState }, [stepState])

  // ── Auto-play ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || mode !== 'step') return
    const id = setInterval(async () => {
      const current = stepStateRef.current
      if (!current || current.queue.length === 0) {
        setAutoPlay(false)
        return
      }
      setLoading(true)
      try {
        const updated = await roundRobinService.tick(current)
        setStepState(updated)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Step failed')
        setAutoPlay(false)
      } finally {
        setLoading(false)
      }
    }, autoPlaySpeed)
    return () => clearInterval(id)
  }, [autoPlay, autoPlaySpeed, mode, roundRobinService])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function validateProcesses() {
    const processes: Array<{ pid: number; burstTime: number }> = []
    const seen = new Set<number>()
    for (const row of rows) {
      const pid = parseInt(row.pid, 10)
      const bt = parseInt(row.burstTime, 10)
      if (isNaN(pid) || pid <= 0) { setError(`Invalid PID "${row.pid}"`); return null }
      if (isNaN(bt) || bt <= 0)  { setError(`Invalid burst time "${row.burstTime}" for P${pid}`); return null }
      if (seen.has(pid))          { setError(`Duplicate PID ${pid}`); return null }
      seen.add(pid)
      processes.push({ pid, burstTime: bt })
    }
    return processes
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleRowChange(id: number, field: 'pid' | 'burstTime', value: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function handleAddRow() {
    setRows(prev => [...prev, { id: nextId, pid: String(nextId), burstTime: '5' }])
    setNextId(n => n + 1)
  }

  function handleRemoveRow(id: number) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function handleSimulate() {
    const processes = validateProcesses()
    if (!processes) return
    setLoading(true); setError(null); setMode('idle'); setSimulateResult(null)
    try {
      const result = await roundRobinService.simulate(timeQuantum, processes)
      setSimulateResult(result); setMode('simulate')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally { setLoading(false) }
  }

  function handleStartStep() {
    const processes = validateProcesses()
    if (!processes) return
    setError(null); setAutoPlay(false)
    const initial: SchedulerState = {
      queue: processes.map(p => ({ pid: p.pid, burstTime: p.burstTime, remainingTime: p.burstTime })),
      blockedQueue: [],
      completedProcesses: [],
      executionLog: [],
      currentTime: 0,
      timeQuantum,
    }
    setStepState(initial); setSimulateResult(null); setMode('step')
  }

  async function handleStep() {
    if (!stepState || stepState.queue.length === 0) return
    setLoading(true); setError(null)
    try {
      const updated = await roundRobinService.tick(stepState)
      setStepState(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Step failed')
    } finally { setLoading(false) }
  }

  async function handleBlock(pid: number) {
    if (!stepState) return
    setLoading(true); setError(null); setAutoPlay(false)
    try {
      const updated = await roundRobinService.block(stepState, pid)
      setStepState(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Block failed')
    } finally { setLoading(false) }
  }

  async function handleUnblock(pid: number) {
    if (!stepState) return
    setLoading(true); setError(null)
    try {
      const updated = await roundRobinService.unblock(stepState, pid)
      setStepState(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unblock failed')
    } finally { setLoading(false) }
  }

  function handleReset() {
    setMode('idle'); setSimulateResult(null); setStepState(null); setAutoPlay(false); setError(null)
  }

  const isDone = mode === 'step' && stepState !== null
    && stepState.queue.length === 0
    && stepState.blockedQueue.length === 0
  const displaySteps = mode === 'simulate'
    ? simulateResult?.executionLog ?? []
    : stepState?.executionLog ?? []
  const displayResults = mode === 'simulate' ? simulateResult?.processResults ?? [] : []

  return (
    <BaseLayout>
      <div className="flex flex-col gap-6 w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm flex-wrap">
          <Link to="/" className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud" className="text-neutral-500 hover:text-neutral-300 transition-colors">UD</Link>
          <span className="text-neutral-600">/</span>
          <Link to="/slab/ud/operative-systems" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Operative Systems
          </Link>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-300">Round-Robin Scheduler</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <Text variant="h2" color="default">Round-Robin Scheduler</Text>
          <Text variant="small" color="muted">
            CPU scheduling with configurable time quantum — animated queue, Gantt chart, process blocking
          </Text>
        </div>

        {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* ── Left panel ────────────────────────────────────────────────── */}
          <Card padding="md" className="flex flex-col gap-5">
            <Text variant="h4" color="default">Processes</Text>
            <ProcessInput
              rows={rows} timeQuantum={timeQuantum} loading={loading}
              onRowChange={handleRowChange} onAddRow={handleAddRow} onRemoveRow={handleRemoveRow}
              onQuantumChange={setTimeQuantum} onSimulate={handleSimulate} onStartStep={handleStartStep}
            />
            {mode !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>↺ Reset</Button>
            )}
          </Card>

          {/* ── Right panel ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Step mode */}
            {mode === 'step' && stepState && (
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Text variant="h4" color="default">Step-by-Step</Text>
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <>
                        <Button variant="primary" size="sm" loading={loading && !autoPlay} onClick={handleStep}
                          disabled={stepState.queue.length === 0}>
                          Next Step →
                        </Button>
                        <Button
                          variant={autoPlay ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={stepState.queue.length === 0}
                          onClick={() => setAutoPlay(v => !v)}
                        >
                          {autoPlay ? '⏸ Pause' : '▶ Auto'}
                        </Button>
                      </>
                    )}
                    {isDone && <span className="text-green-400 text-sm font-semibold">✓ Complete</span>}
                    {!isDone && stepState.queue.length === 0 && stepState.blockedQueue.length > 0 && (
                      <span className="text-amber-400 text-sm">Waiting — unblock a process</span>
                    )}
                  </div>
                </div>

                {autoPlay && (
                  <div className="flex items-center gap-3">
                    <Text variant="caption" color="muted">Speed:</Text>
                    <input type="range" min={200} max={2000} step={100}
                      value={autoPlaySpeed}
                      onChange={e => setAutoPlaySpeed(Number(e.target.value))}
                      className="flex-1 accent-primary-500" />
                    <Text variant="caption" color="muted" className="font-mono w-14">{autoPlaySpeed}ms</Text>
                  </div>
                )}

                <QueueVisualizer
                  queue={stepState.queue}
                  blockedQueue={stepState.blockedQueue}
                  currentTime={stepState.currentTime}
                  onBlock={handleBlock}
                />

                <BlockedQueuePanel
                  blockedQueue={stepState.blockedQueue}
                  onUnblock={handleUnblock}
                  loading={loading}
                />
              </Card>
            )}

            {/* Gantt chart */}
            {displaySteps.length > 0 && (
              <Card padding="md">
                <GanttChart
                  steps={displaySteps}
                  totalTime={
                    mode === 'simulate' ? (simulateResult?.totalTime ?? 0) : (stepState?.currentTime ?? 0)
                  }
                />
              </Card>
            )}

            {/* Execution log */}
            {displaySteps.length > 0 && (
              <Card padding="md">
                <ExecutionLog steps={displaySteps} />
              </Card>
            )}

            {/* Metrics (simulate mode only) */}
            {mode === 'simulate' && simulateResult && (
              <Card padding="md">
                <MetricsTable
                  results={displayResults}
                  averageTurnaround={simulateResult.averageTurnaroundTime}
                  averageWaiting={simulateResult.averageWaitingTime}
                />
              </Card>
            )}

            {/* Idle placeholder */}
            {mode === 'idle' && (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Configure processes and click <strong className="text-neutral-200">Run All</strong> for a full simulation,
                  or <strong className="text-neutral-200">Step Mode</strong> to advance one quantum at a time.
                </Text>
                <Text variant="caption" color="muted" className="text-center">
                  In Step Mode, hover over a process block and click <strong className="text-neutral-200">⊗</strong> to block it.
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
