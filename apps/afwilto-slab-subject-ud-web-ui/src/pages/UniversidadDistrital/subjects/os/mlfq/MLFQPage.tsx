import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BaseLayout, Text, Button, Card, Alert } from '@afwilto/design-system'
import { useServices } from '@/di'
import { ProcessInput } from './ProcessInput'
import { ThreeQueueVisualizer } from './ThreeQueueVisualizer'
import { BlockedQueuePanel } from './BlockedQueuePanel'
import { CPUSlot } from './CPUSlot'
import { GanttChart } from './GanttChart'
import { MetricsTable } from './MetricsTable'
import { PromotionLog } from './PromotionLog'
import type { MLFQQueueLevel, MLFQState, MLFQSimulateResponse } from './types'
import { QUEUE_COLORS } from './types'
import type { ProcessRow } from './types'

const DEFAULT_ROWS: ProcessRow[] = [
  { id: 1, pid: '1', name: 'P1', burstTime: '10', queueLevel: 'RoundRobin' },
  { id: 2, pid: '2', name: 'P2', burstTime: '3',  queueLevel: 'RoundRobin' },
  { id: 3, pid: '3', name: 'P3', burstTime: '6',  queueLevel: 'ShortestJobFirst' },
  { id: 4, pid: '4', name: 'P4', burstTime: '15', queueLevel: 'FirstComeFirstServed' },
]

type Mode = 'idle' | 'simulate' | 'step'

export function MLFQPage() {
  const { mlfqService } = useServices()

  const [rows, setRows] = useState<ProcessRow[]>(DEFAULT_ROWS)
  const [nextId, setNextId] = useState(5)
  const [quantum, setQuantum] = useState(4)
  const [agingThreshold, setAgingThreshold] = useState(8)

  const [mode, setMode] = useState<Mode>('idle')
  const [simulateResult, setSimulateResult] = useState<MLFQSimulateResponse | null>(null)
  const [stepState, setStepState] = useState<MLFQState | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(800)

  const stepStateRef = useRef(stepState)
  useEffect(() => { stepStateRef.current = stepState }, [stepState])

  // ── Auto-play ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || mode !== 'step') return
    const id = setInterval(async () => {
      const current = stepStateRef.current
      if (!current || !current.rrQueue.length && !current.sjfQueue.length && !current.fcfsQueue.length) {
        setAutoPlay(false)
        return
      }
      setLoading(true)
      try {
        const updated = await mlfqService.tick(current)
        setStepState(updated)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Tick failed')
        setAutoPlay(false)
      } finally {
        setLoading(false)
      }
    }, autoPlaySpeed)
    return () => clearInterval(id)
  }, [autoPlay, autoPlaySpeed, mode, mlfqService])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function validateProcesses() {
    const seen = new Set<number>()
    const byQueue: Record<MLFQQueueLevel, Array<{ pid: number; name: string; burstTime: number }>> = {
      RoundRobin: [], ShortestJobFirst: [], FirstComeFirstServed: [],
    }
    for (const row of rows) {
      const pid = parseInt(row.pid, 10)
      const bt  = parseInt(row.burstTime, 10)
      if (isNaN(pid) || pid <= 0) { setError(`Invalid PID "${row.pid}"`); return null }
      if (isNaN(bt)  || bt  <= 0) { setError(`Invalid burst "${row.burstTime}" for P${pid}`); return null }
      if (seen.has(pid))           { setError(`Duplicate PID ${pid}`); return null }
      seen.add(pid)
      byQueue[row.queueLevel].push({ pid, name: row.name || `P${pid}`, burstTime: bt })
    }
    return byQueue
  }

  function handleRowChange(id: number, field: keyof Omit<ProcessRow, 'id'>, value: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }
  function handleAddRow() {
    setRows(prev => [...prev, { id: nextId, pid: String(nextId), name: `P${nextId}`, burstTime: '5', queueLevel: 'RoundRobin' }])
    setNextId(n => n + 1)
  }
  function handleRemoveRow(id: number) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  async function handleSimulate() {
    const byQueue = validateProcesses()
    if (!byQueue) return
    setLoading(true); setError(null); setMode('idle'); setSimulateResult(null)
    try {
      const result = await mlfqService.simulate(
        { quantum, agingThreshold },
        { roundRobin: byQueue.RoundRobin, sjf: byQueue.ShortestJobFirst, fcfs: byQueue.FirstComeFirstServed },
      )
      setSimulateResult(result); setMode('simulate')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  function handleStartStep() {
    const byQueue = validateProcesses()
    if (!byQueue) return
    setError(null); setAutoPlay(false)
    const initial: MLFQState = {
      rrQueue:   byQueue.RoundRobin.map(p => ({ pid: p.pid, name: p.name, burstTime: p.burstTime, remainingTime: p.burstTime, agingCounter: 0, priority: 'RoundRobin',           blockedFrom: null })),
      sjfQueue:  byQueue.ShortestJobFirst.map(p => ({ pid: p.pid, name: p.name, burstTime: p.burstTime, remainingTime: p.burstTime, agingCounter: 0, priority: 'ShortestJobFirst',     blockedFrom: null })),
      fcfsQueue: byQueue.FirstComeFirstServed.map(p => ({ pid: p.pid, name: p.name, burstTime: p.burstTime, remainingTime: p.burstTime, agingCounter: 0, priority: 'FirstComeFirstServed', blockedFrom: null })),
      blockedQueue: [], completed: [], executionLog: [],
      config: { quantum, agingThreshold },
      currentTime: 0,
    }
    setStepState(initial); setSimulateResult(null); setMode('step')
  }

  async function handleStep() {
    if (!stepState) return
    setLoading(true); setError(null)
    try {
      const updated = await mlfqService.tick(stepState)
      setStepState(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Step failed')
    } finally { setLoading(false) }
  }

  async function handleUnblock(pid: number) {
    if (!stepState) return
    setLoading(true); setError(null)
    try {
      const updated = await mlfqService.unblock(stepState, pid)
      setStepState(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unblock failed')
    } finally { setLoading(false) }
  }

  function handleReset() {
    setMode('idle'); setSimulateResult(null); setStepState(null); setAutoPlay(false); setError(null)
  }

  const isDone = mode === 'step' && stepState !== null
    && !stepState.rrQueue.length && !stepState.sjfQueue.length && !stepState.fcfsQueue.length
  const displaySteps = mode === 'simulate' ? (simulateResult?.executionLog ?? []) : (stepState?.executionLog ?? [])
  const lastStep = displaySteps.length > 0 ? displaySteps[displaySteps.length - 1] : null

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
          <span className="text-neutral-300">MLFQ Scheduler</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-1">
          <Text variant="h2" color="default">MLFQ Scheduler</Text>
          <Text variant="small" color="muted">
            Multi-Level Feedback Queue — three priority queues, aging promotions, blocking/unblocking
          </Text>
        </div>

        {/* Queue level legend */}
        <div className="flex gap-4 flex-wrap">
          {(['RoundRobin', 'ShortestJobFirst', 'FirstComeFirstServed'] as const).map(l => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: QUEUE_COLORS[l] }} />
              <Text variant="caption" color="muted">
                {l === 'RoundRobin' ? 'Q1 Round-Robin' : l === 'ShortestJobFirst' ? 'Q2 SJF' : 'Q3 FCFS'}
              </Text>
            </div>
          ))}
        </div>

        {error && <Alert variant="error" title="Error" onClose={() => setError(null)}>{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

          {/* ── Left panel ────────────────────────────────────────────────── */}
          <Card padding="md" className="flex flex-col gap-5">
            <Text variant="h4" color="default">Configuration</Text>
            <ProcessInput
              rows={rows} quantum={quantum} agingThreshold={agingThreshold} loading={loading}
              onRowChange={handleRowChange} onAddRow={handleAddRow} onRemoveRow={handleRemoveRow}
              onQuantumChange={setQuantum} onAgingChange={setAgingThreshold}
              onSimulate={handleSimulate} onStartStep={handleStartStep}
            />
            {mode !== 'idle' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>↺ Reset</Button>
            )}
          </Card>

          {/* ── Right panel ───────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Step mode controls */}
            {mode === 'step' && stepState && (
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Text variant="h4" color="default">Step-by-Step</Text>
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <>
                        <Button variant="primary" size="sm" loading={loading && !autoPlay} onClick={handleStep}>
                          Next Tick →
                        </Button>
                        <Button variant={autoPlay ? 'danger' : 'secondary'} size="sm"
                          onClick={() => setAutoPlay(v => !v)}>
                          {autoPlay ? '⏸ Pause' : '▶ Auto'}
                        </Button>
                      </>
                    )}
                    {isDone && <span className="text-green-400 text-sm font-semibold">✓ Complete</span>}
                  </div>
                </div>

                {autoPlay && (
                  <div className="flex items-center gap-3">
                    <Text variant="caption" color="muted">Speed:</Text>
                    <input type="range" min={200} max={2000} step={100} value={autoPlaySpeed}
                      onChange={e => setAutoPlaySpeed(Number(e.target.value))}
                      className="flex-1 accent-primary-500" />
                    <Text variant="caption" color="muted" className="font-mono w-14">{autoPlaySpeed}ms</Text>
                  </div>
                )}

                <CPUSlot lastStep={lastStep} />
                <ThreeQueueVisualizer
                  rrQueue={stepState.rrQueue} sjfQueue={stepState.sjfQueue}
                  fcfsQueue={stepState.fcfsQueue} currentTime={stepState.currentTime}
                />
                <BlockedQueuePanel
                  blockedQueue={stepState.blockedQueue} onUnblock={handleUnblock} loading={loading}
                />
              </Card>
            )}

            {/* Gantt chart */}
            {displaySteps.length > 0 && (
              <Card padding="md">
                <GanttChart steps={displaySteps}
                  totalTime={mode === 'simulate' ? (simulateResult?.totalTime ?? 0) : (stepState?.currentTime ?? 0)} />
              </Card>
            )}

            {/* Promotion log */}
            {displaySteps.some(s => s.promotions.length > 0) && (
              <Card padding="md">
                <PromotionLog steps={displaySteps} />
              </Card>
            )}

            {/* Metrics (simulate mode only) */}
            {mode === 'simulate' && simulateResult && (
              <Card padding="md" className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Text variant="h4" color="default">Results</Text>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                      <Text variant="caption" color="muted">Total time</Text>
                      <Text variant="small" weight="semibold" color="default" className="font-mono">
                        {simulateResult.totalTime}u
                      </Text>
                    </div>
                    <div className="flex flex-col items-end">
                      <Text variant="caption" color="muted">Promotions</Text>
                      <Text variant="small" weight="semibold" color="default" className="font-mono">
                        {simulateResult.totalPromotions}
                      </Text>
                    </div>
                  </div>
                </div>
                <MetricsTable
                  results={simulateResult.processResults}
                  averageTurnaround={simulateResult.averageTurnaroundTime}
                  averageWaiting={simulateResult.averageWaitingTime}
                />
              </Card>
            )}

            {/* Idle placeholder */}
            {mode === 'idle' && (
              <Card padding="md" className="flex flex-col items-center gap-3 py-12">
                <Text variant="body" color="muted" className="text-center">
                  Configure processes across three queues and click <strong className="text-neutral-200">Run All</strong> or{' '}
                  <strong className="text-neutral-200">Step Mode</strong>.
                </Text>
                <Text variant="caption" color="muted" className="text-center">
                  Pre-loaded: P1/P2 in RR, P3 in SJF, P4 in FCFS · Q=4, aging=8
                </Text>
              </Card>
            )}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
