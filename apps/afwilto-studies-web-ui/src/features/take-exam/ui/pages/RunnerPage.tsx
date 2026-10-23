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
  /** What the server holds, per position: the selection and the flag. */
  const savedRef = useRef(new Map(attempt.items.map((i) => [i.position, { selected: i.selected, flagged: i.flagged }])))
  const queues = useRef(new Map<number, Promise<void>>())
  const [saving, setSaving] = useState<ReadonlyMap<number, number>>(new Map())
  const [failedPosition, setFailedPosition] = useState<number>()
  const [sync, setSync] = useState<CountdownSync | undefined>(timed ? { seconds: attempt.remainingSeconds!, token: 0 } : undefined)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const closing = useRef(false)
  const resultPath = `/studies/attempts/${attempt.id}/result`
  const resolveMediaUrl = useCallback((sha: string) => examsService.mediaUrl(sha), [examsService])

  const setAllItems = (next: AttemptItem[]) => {
    itemsRef.current = next
    setItems(next)
  }
  const patchItem = (at: number, patch: Partial<AttemptItem>) =>
    setAllItems(itemsRef.current.map((item) => (item.position === at ? { ...item, ...patch } : item)))
  const goTo = (at: number) => setParams({ q: String(Math.min(Math.max(at, 0), total - 1) + 1) }, { replace: true })
  const toResult = useCallback(() => {
    closing.current = true
    navigate(resultPath, { replace: true })
  }, [navigate, resultPath])

  // ── the clock: the server's remainingSeconds is the truth ────────────────
  const refreshClock = useCallback(async () => {
    if (!timed || closing.current) return
    try {
      const fresh = await examsService.getAttempt(attempt.id)
      if (fresh.status !== 'in_progress') return toResult()
      if (fresh.remainingSeconds !== undefined) {
        const seconds = fresh.remainingSeconds
        setSync((s) => ({ seconds, token: (s?.token ?? 0) + 1 }))
      }
    } catch {
      // Offline for a moment: the local clock keeps counting.
    }
  }, [timed, examsService, attempt.id, toResult])

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

  /** Sends the item's state; saves of one item go out in order. `force` skips the "nothing changed" check (retry). */
  const save = (at: number, force = false) => {
    const item = itemsRef.current[at]
    const saved = savedRef.current.get(at) ?? { selected: [], flagged: false }
    const payload = answerPayload(item, saved.selected, feedback)
    if (!force && payload.flagged === saved.flagged && payload.selected.length === saved.selected.length && payload.selected.every((l) => saved.selected.includes(l))) return
    patchItem(at, { answered: payload.selected.length > 0 })
    track(at, 1)
    const run = async () => {
      try {
        const outcome = await examsService.answerItem(attempt.id, at, payload)
        savedRef.current.set(at, { selected: outcome.selected, flagged: outcome.flagged })
        if (outcome.reveal) patchItem(at, { reveal: outcome.reveal, answered: true })
        setFailedPosition((p) => (p === at ? undefined : p))
        void refreshClock()
      } catch (e) {
        if (e instanceof ExamsConflictError && (e.rule === 'attempt_expired' || e.rule === 'attempt_closed')) toResult()
        else setFailedPosition(at)
      } finally {
        track(at, -1)
      }
    }
    queues.current.set(at, (queues.current.get(at) ?? Promise.resolve()).then(run))
  }

  const toggleOption = (label: string) => {
    const item = itemsRef.current[position]
    const selected = toggleSelection(itemView(item), item.selected, label)
    if (selected === item.selected) return
    patchItem(position, { selected })
    save(position)
  }
  const toggleFlag = () => {
    patchItem(position, { flagged: !itemsRef.current[position].flagged })
    save(position)
  }

  // ── submitting ───────────────────────────────────────────────────────────
  /** Waits for the saves in flight, then closes the attempt; a refused submit on a closed attempt still opens the result. */
  const submit = async () => {
    if (closing.current) return
    closing.current = true
    setSubmitting(true)
    await Promise.allSettled([...queues.current.values()])
    try {
      await examsService.submitAttempt(attempt.id)
      toResult()
    } catch (e) {
      if (e instanceof ExamsConflictError && (e.rule === 'attempt_expired' || e.rule === 'attempt_closed')) return toResult()
      closing.current = false
      setSubmitting(false)
      throw e
    }
  }
  const remaining = useCountdown(sync, () => {
    submit().catch((e: unknown) => setSubmitError(e instanceof Error ? e.message : String(e)))
  })

  // ── keyboard: F flags, ←/→ move, Enter goes on; 1–6 belong to QuestionView ──
  const keys = useRef({ toggleFlag, goTo, position })
  keys.current = { toggleFlag, goTo, position }
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || isTypingTarget(e.target)) return
      const { toggleFlag: flag, goTo: go, position: at } = keys.current
      if (e.key === 'f' || e.key === 'F') flag()
      else if (e.key === 'ArrowRight') go(at + 1)
      else if (e.key === 'ArrowLeft') go(at - 1)
      else if (e.key === 'Enter' && !(e.target instanceof HTMLElement && e.target.closest('button, a'))) go(at + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const item = items[position]
  return (
    <div className="flex flex-col gap-4">
      <RunnerHeader examName={examName} position={position} total={total} remainingSeconds={remaining} />
      {submitError && <Alert variant="error" title="No se pudo entregar el simulacro">{submitError}</Alert>}
      <div className="flex flex-wrap items-start gap-6">
        <main className="flex basis-[36rem] grow flex-col gap-4">
          <QuestionView
            key={item.position}
            question={itemView(item)}
            selected={item.selected}
            onToggle={toggleOption}
            disabled={item.reveal !== undefined}
            reveal={item.reveal && { correctLabels: item.reveal.correctLabels, rationales: item.reveal.rationales, explanation: item.reveal.explanation }}
            resolveMediaUrl={resolveMediaUrl}
          />
        </main>
        <aside className="flex basis-[16rem] grow flex-col gap-2">
          <QuestionNavigator items={items} current={position} saving={new Set(saving.keys())} onSelect={goTo} />
        </aside>
      </div>
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
      {failedPosition !== undefined && (
        <SaveFailedToast question={failedPosition + 1} onRetry={() => save(failedPosition, true)} onDismiss={() => setFailedPosition(undefined)} />
      )}
      {confirming && <SubmitConfirm unanswered={unansweredCount(items)} onConfirm={submit} onClose={() => setConfirming(false)} />}
    </div>
  )
}
