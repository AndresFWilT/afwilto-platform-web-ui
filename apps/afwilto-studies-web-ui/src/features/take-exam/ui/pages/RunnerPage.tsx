import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, EmptyState } from '@afwilto/design-system'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import {
  answerPayload,
  feedbackOf,
  itemView,
  toggleSelection,
  unansweredCount,
  type AnswerInput,
  type Attempt,
  type AttemptItem,
} from '@/exams/domain'
import { ExamsConflictError, ExamsNotFoundError } from '@/exams/application/ports'
import { useCountdown, type CountdownSync } from '@/shared/lib/useCountdown'
import { LoadingRows } from '@/shared/ui/atoms/LoadingRows'
import { LoadError } from '@/shared/ui/molecules/LoadError'
import { QuestionView } from '@/shared/ui/organisms/QuestionView'
import { QuestionNavigator } from '../organisms/QuestionNavigator'
import { RunnerFooter } from '../organisms/RunnerFooter'
import { RunnerHeader } from '../organisms/RunnerHeader'
import { SaveFailedToast } from '../organisms/SaveFailedToast'
import { SubmitConfirm } from '../organisms/SubmitConfirm'
import { RunnerTemplate } from '../templates/RunnerTemplate'
import { UnsavedConfirm } from '../organisms/UnsavedConfirm'
import { MultiChoiceHint } from '../molecules/MultiChoiceHint'

export function RunnerPage() {
  const { attemptId = '' } = useParams()
  const { examsService } = useServices()
  const loaded = useAsync(async () => {
    const attempt = await examsService.getAttempt(attemptId)
    const exam = await examsService.getExam(attempt.examId).catch(() => null)
    return { attempt, examName: exam?.name ?? '' }
  }, [examsService, attemptId])

  if (loaded.status === 'loading') return <LoadingRows />
  if (loaded.status === 'error') {
    return loaded.error instanceof ExamsNotFoundError ? (
      <EmptyState icon="🔎" title="Simulacro no encontrado" description="Puede que se haya eliminado." />
    ) : (
      <LoadError error={loaded.error} title="No se pudo cargar el simulacro" />
    )
  }
  const { attempt, examName } = loaded.data
  // A closed attempt (submitted, or expired by the server) has nothing left to run.
  if (attempt.status !== 'in_progress') return <Navigate to={`/studies/attempts/${attempt.id}/result`} replace />
  return <Runner attempt={attempt} examName={examName} />
}

/** The 0-based position `?q=` (1-based) asks for, clamped to the attempt. */
function positionFrom(q: string | null, total: number): number {
  const n = Number.parseInt(q ?? '', 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), total) - 1 : 0
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"], dialog[open]') !== null

const samePayload = (a: AnswerInput, b: AnswerInput) =>
  a.flagged === b.flagged && a.selected.length === b.selected.length && a.selected.every((l) => b.selected.includes(l))

const isClosedRule = (e: unknown) => e instanceof ExamsConflictError && (e.rule === 'attempt_expired' || e.rule === 'attempt_closed')
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** The submit at 0 is retried this long after each failure (then the error is shown). */
const SUBMIT_BACKOFF_MS = [1000, 2000, 4000]

function Runner({ attempt, examName }: { attempt: Attempt; examName: string }) {
  const { examsService } = useServices()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const feedback = feedbackOf(attempt.config)
  const total = attempt.items.length
  const position = positionFrom(params.get('q'), total)
  const timed = attempt.remainingSeconds !== undefined

  const [items, setItems] = useState<AttemptItem[]>(attempt.items)
  const itemsRef = useRef(items)
  /** The last payload queued per item (not the last acknowledged): the next save is compared with it. */
  const queued = useRef(new Map<number, AnswerInput>(attempt.items.map((i) => [i.position, { selected: i.selected, flagged: i.flagged }])))
  const queues = useRef(new Map<number, Promise<void>>())
  const [saving, setSaving] = useState<ReadonlyMap<number, number>>(new Map())
  /** Saves in flight per item, readable inside `run` (the `saving` state is stale there). */
  const inFlight = useRef(new Map<number, number>())
  /** Positions whose last save failed. */
  const failedRef = useRef(new Set<number>())
  const [failed, setFailed] = useState<number[]>([])
  const [dismissedKey, setDismissedKey] = useState('')
  /** Review mode: items locked from the click of their first (revealing) save. */
  const lockedRef = useRef(new Set<number>(attempt.items.filter((i) => i.reveal).map((i) => i.position)))
  const [locked, setLocked] = useState<ReadonlySet<number>>(new Set(lockedRef.current))
  /** When the request behind the latest applied clock sync started (performance.now()). */
  const syncedAt = useRef(performance.now())
  const [sync, setSync] = useState<CountdownSync | undefined>(timed ? { seconds: attempt.remainingSeconds!, token: 0 } : undefined)
  const [confirming, setConfirming] = useState(false)
  const [unsaved, setUnsaved] = useState<number[]>()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const closing = useRef(false)
  const autoSubmitting = useRef(false)
  /** The countdown is at 0 (cleared by the next clock sync). */
  const expired = useRef(false)
  const alive = useRef(true)
  const resultPath = `/studies/attempts/${attempt.id}/result`
  const resolveMediaUrl = useCallback((sha: string) => examsService.mediaUrl(sha), [examsService])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const setAllItems = (next: AttemptItem[]) => {
    itemsRef.current = next
    setItems(next)
  }
  const patchItem = (at: number, patch: Partial<AttemptItem>) =>
    setAllItems(itemsRef.current.map((item) => (item.position === at ? { ...item, ...patch } : item)))
  const goTo = (at: number) => setParams({ q: String(Math.min(Math.max(at, 0), total - 1) + 1) }, { replace: true })
  const toResult = useCallback(
    (unsavedAnswers = 0) => {
      closing.current = true
      navigate(resultPath, { replace: true, state: unsavedAnswers > 0 ? { unsavedAnswers } : undefined })
    },
    [navigate, resultPath]
  )
  const setLock = (at: number, on: boolean) => {
    if (on) lockedRef.current.add(at)
    else lockedRef.current.delete(at)
    setLocked(new Set(lockedRef.current))
  }
  const setFailedAt = (at: number, on: boolean) => {
    if (on) failedRef.current.add(at)
    else failedRef.current.delete(at)
    setFailed([...failedRef.current].sort((a, b) => a - b))
  }

  // ── the clock: the server's remainingSeconds is the truth ────────────────
  /** Applies a server clock reading unless a later request has already been applied. */
  const applySync = useCallback((seconds: number, requestedAt: number) => {
    if (requestedAt < syncedAt.current) return
    syncedAt.current = requestedAt
    expired.current = false
    setSync((s) => ({ seconds, token: (s?.token ?? 0) + 1 }))
  }, [])

  /** GET is only for focus, visibility and mount; every PUT response carries the clock already. */
  const refreshClock = useCallback(async () => {
    if (!timed || closing.current) return
    const requestedAt = performance.now()
    try {
      const fresh = await examsService.getAttempt(attempt.id)
      if (fresh.status !== 'in_progress') return toResult()
      if (fresh.remainingSeconds !== undefined) applySync(fresh.remainingSeconds, requestedAt)
    } catch {
      // Offline for a moment: the local clock keeps counting.
    }
  }, [timed, examsService, attempt.id, toResult, applySync])

  useEffect(() => {
    const onVisibility = () => document.visibilityState === 'visible' && void refreshClock()
    const onFocus = () => void refreshClock()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshClock])

  // ── saving ───────────────────────────────────────────────────────────────
  const track = (at: number, delta: 1 | -1) =>
    setSaving((current) => {
      const next = new Map(current)
      const count = (next.get(at) ?? 0) + delta
      if (count > 0) next.set(at, count)
      else next.delete(at)
      return next
    })

  /** After a 409 `answer_locked` the server holds a revealed choice: show it instead of the local one. */
  const resyncItem = async (at: number) => {
    const requestedAt = performance.now()
    const fresh = await examsService.getAttempt(attempt.id)
    if (fresh.status !== 'in_progress') return toResult()
    const server = fresh.items[at]
    if (!server) return
    queued.current.set(at, { selected: server.selected, flagged: server.flagged })
    patchItem(at, { selected: server.selected, flagged: server.flagged, answered: server.answered, reveal: server.reveal })
    setLock(at, server.reveal !== undefined)
    if (fresh.remainingSeconds !== undefined) applySync(fresh.remainingSeconds, requestedAt)
  }

  /**
   * Sends the item's state; saves of one item go out in order and are compared with the last one queued.
   * `force` skips the "nothing changed" check (retry).
   */
  const save = (at: number, force = false) => {
    const item = itemsRef.current[at]
    const last = queued.current.get(at) ?? { selected: [], flagged: false }
    const payload = answerPayload(item, last.selected, feedback)
    if (!force && samePayload(payload, last)) return
    queued.current.set(at, payload)
    patchItem(at, { answered: payload.selected.length > 0 })
    // Review mode: the first non-empty save reveals and locks on the server, so lock here from the click.
    if (feedback === 'each' && payload.selected.length > 0 && !item.reveal) setLock(at, true)
    track(at, 1)
    inFlight.current.set(at, (inFlight.current.get(at) ?? 0) + 1)
    /** Under review mode an item unlocks only when this is the last save of it still in flight. */
    const lastInFlight = () => (inFlight.current.get(at) ?? 0) <= 1
    const run = async () => {
      const requestedAt = performance.now()
      try {
        const outcome = await examsService.answerItem(attempt.id, at, payload)
        if (outcome.remainingSeconds !== undefined) applySync(outcome.remainingSeconds, requestedAt)
        if (outcome.reveal) patchItem(at, { reveal: outcome.reveal, answered: true, selected: outcome.selected })
        else if (feedback === 'each' && lastInFlight()) setLock(at, false)
        setFailedAt(at, false)
      } catch (e) {
        if (isClosedRule(e)) return toResult()
        if (e instanceof ExamsConflictError && e.rule === 'answer_locked') {
          try {
            await resyncItem(at)
            setFailedAt(at, false)
          } catch {
            setFailedAt(at, true)
          }
        } else {
          if (!itemsRef.current[at].reveal && lastInFlight()) setLock(at, false)
          setFailedAt(at, true)
        }
      } finally {
        inFlight.current.set(at, (inFlight.current.get(at) ?? 1) - 1)
        track(at, -1)
      }
    }
    queues.current.set(at, (queues.current.get(at) ?? Promise.resolve()).then(run))
  }
  const settleSaves = () => Promise.allSettled([...queues.current.values()])

  // While submitting (`closing`) nothing may be enqueued: `settleSaves` has already snapshotted the queue.
  const toggleOption = (label: string) => {
    const item = itemsRef.current[position]
    if (closing.current || item.reveal || lockedRef.current.has(position)) return
    const selected = toggleSelection(itemView(item), item.selected, label)
    if (selected === item.selected) return
    patchItem(position, { selected })
    save(position)
  }
  const toggleFlag = () => {
    if (closing.current) return
    patchItem(position, { flagged: !itemsRef.current[position].flagged })
    save(position)
  }
  const retryFailed = () => [...failedRef.current].forEach((at) => save(at, true))

  // ── submitting ───────────────────────────────────────────────────────────
  /**
   * Waits for the saves in flight, retries the failed ones once, then closes the attempt. A manual submit that
   * still has unsaved answers asks first (`confirmed` skips that); a refused submit on a closed attempt opens the result.
   */
  const submit = async ({ auto = false, confirmed = false } = {}) => {
    if (closing.current) return
    closing.current = true
    setSubmitting(true)
    try {
      await settleSaves()
      if (failedRef.current.size > 0) {
        retryFailed()
        await settleSaves()
      }
      const unsavedNow = [...failedRef.current].sort((a, b) => a - b)
      if (unsavedNow.length > 0 && !auto && !confirmed) {
        closing.current = false
        setSubmitting(false)
        setConfirming(false)
        setUnsaved(unsavedNow.map((at) => at + 1))
        return
      }
      await examsService.submitAttempt(attempt.id)
      toResult(unsavedNow.length)
    } catch (e) {
      if (isClosedRule(e)) return toResult()
      closing.current = false
      setSubmitting(false)
      // The clock hit 0 while this manual submit was in flight and the auto-submit stood aside: it takes over now.
      if (expired.current && !auto) void autoSubmit()
      throw e
    }
  }

  /** At 0: submit, and on failure retry with backoff before showing the error. */
  const autoSubmit = async () => {
    if (autoSubmitting.current) return
    autoSubmitting.current = true
    try {
      for (let retry = 0; ; retry++) {
        try {
          return await submit({ auto: true })
        } catch (e) {
          if (retry >= SUBMIT_BACKOFF_MS.length) throw e
          await sleep(SUBMIT_BACKOFF_MS[retry])
          if (!alive.current || closing.current) return
        }
      }
    } catch (e) {
      if (alive.current) setSubmitError(e instanceof Error ? e.message : String(e))
    } finally {
      autoSubmitting.current = false
    }
  }
  const remaining = useCountdown(sync, () => {
    expired.current = true
    void autoSubmit()
  })
  /** Cancelling the unsaved-answers question after the clock hit 0 must not leave the attempt open for good. */
  const dismissUnsaved = () => {
    setUnsaved(undefined)
    if (expired.current) void autoSubmit()
  }

  // ── keyboard: F flags, 1–6 pick, ←/→ move, Enter goes on ─────────────────
  const keys = useRef({ toggleFlag, toggleOption, goTo, position })
  keys.current = { toggleFlag, toggleOption, goTo, position }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || isTypingTarget(e.target)) return
      const { toggleFlag: flag, toggleOption: pick, goTo: go, position: at } = keys.current
      if (e.key === 'f' || e.key === 'F') {
        if (!e.repeat) flag()
      } else if (/^[1-6]$/.test(e.key)) {
        const option = itemsRef.current[at].options[Number(e.key) - 1]
        if (option && !e.repeat) pick(option.label)
      } else if (e.key === 'ArrowRight') go(at + 1)
      else if (e.key === 'ArrowLeft') go(at - 1)
      else if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button, a'))) go(at + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const item = items[position]
  const itemLocked = item.reveal !== undefined || locked.has(item.position)
  const failedKey = failed.join(',')
  return (
    <RunnerTemplate
      header={<RunnerHeader examName={examName} position={position} total={total} remainingSeconds={remaining} />}
      notice={submitError && <Alert variant="error" title="No se pudo entregar el simulacro">{submitError}</Alert>}
      question={
        <>
          <QuestionView
            key={item.position}
            question={itemView(item)}
            selected={item.selected}
            onToggle={toggleOption}
            disabled={itemLocked || submitting}
            reveal={item.reveal && { correctLabels: item.reveal.correctLabels, rationales: item.reveal.rationales, explanation: item.reveal.explanation }}
            resolveMediaUrl={resolveMediaUrl}
          />
          {feedback === 'each' && item.type === 'multi' && !itemLocked && item.selected.length < (item.chooseCount ?? 1) && (
            <MultiChoiceHint chooseCount={item.chooseCount ?? 1} selectedCount={item.selected.length} />
          )}
        </>
      }
      navigator={<QuestionNavigator items={items} current={position} saving={new Set(saving.keys())} onSelect={goTo} />}
      footer={
        <RunnerFooter
          hasPrevious={position > 0}
          hasNext={position < total - 1}
          flagged={item.flagged}
          submitting={submitting}
          onPrevious={() => goTo(position - 1)}
          onNext={() => goTo(position + 1)}
          onFlag={toggleFlag}
          onSubmit={() => setConfirming(true)}
        />
      }
      overlays={
        <>
          {failed.length > 0 && failedKey !== dismissedKey && (
            <SaveFailedToast questions={failed.map((at) => at + 1)} onRetry={retryFailed} onDismiss={() => setDismissedKey(failedKey)} />
          )}
          {confirming && <SubmitConfirm unanswered={unansweredCount(items)} onConfirm={() => submit()} onClose={() => setConfirming(false)} />}
          {unsaved && <UnsavedConfirm questions={unsaved} onConfirm={() => submit({ confirmed: true })} onClose={dismissUnsaved} />}
        </>
      }
    />
  )
}
