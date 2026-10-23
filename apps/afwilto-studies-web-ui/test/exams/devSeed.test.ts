import { describe, it, expect } from 'vitest'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { examsDevSeed } from '../../src/exams/infrastructure/memory/devSeed'

const EXAM_ID = examsDevSeed.exams[0].id

describe('examsDevSeed: offline `pnpm dev` can take an exam', () => {
  it('carries enough questions for a real simulation: no shortages', async () => {
    const preview = await new InMemoryExamsAdapter(examsDevSeed).previewSession(EXAM_ID, { selection: { kind: 'simulation' } })
    expect(preview.shortages).toEqual([])
    expect(preview.poolSize).toBeGreaterThanOrEqual(65)
    expect(preview.drawCount).toBe(65)
    expect(preview.suggestedMinutes).toBe(130)
  })

  it('has a secondary classification and original sets, so every selection kind has something to pick', async () => {
    const exams = new InMemoryExamsAdapter(examsDevSeed)
    const exam = await exams.getExam(EXAM_ID)
    expect(exam.classifications.map((c) => c.name)).toEqual(['Dominio', 'Servicio'])
    const sets = new Set((await exams.listQuestions(EXAM_ID)).flatMap((q) => (q.origin?.set ? [q.origin.set] : [])))
    expect(sets.size).toBeGreaterThanOrEqual(2)
  })

  it('a started simulation can be answered and submitted end to end', async () => {
    const exams = new InMemoryExamsAdapter(examsDevSeed)
    const attempt = await exams.startAttempt(EXAM_ID, { selection: { kind: 'simulation' } })
    expect(attempt.items).toHaveLength(65)
    await exams.answerItem(attempt.id, 0, { selected: ['A'], flagged: true })
    const result = await exams.submitAttempt(attempt.id)
    expect(result.total).toBe(65)
    expect(result.passed).not.toBeNull()
  })
})
