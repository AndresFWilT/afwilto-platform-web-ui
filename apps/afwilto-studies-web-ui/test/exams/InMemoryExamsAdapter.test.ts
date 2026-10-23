import { describe, it, expect } from 'vitest'
import { InMemoryExamsAdapter, type ExamsSeed } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsConflictError, ExamsValidationError } from '../../src/exams/application/ports'

const SHA = 'ef56'.repeat(16)
const DATA_URL = 'data:image/png;base64,AAAA'
const INPUT = { name: 'SAA-C03', questionCount: 65, timeLimitMin: 130, passPercent: 72 }

function adapter(seed: Partial<ExamsSeed> = {}) {
  return new InMemoryExamsAdapter({ exams: [], media: { [SHA]: DATA_URL }, ...seed })
}

describe('InMemoryExamsAdapter', () => {
  it('mediaUrl returns the seed data URL, or null for an unknown hash', () => {
    expect(adapter().mediaUrl(SHA)).toBe(DATA_URL)
    expect(adapter().mediaUrl('0'.repeat(64))).toBeNull()
  })

  it('createExam stores an exam with version 1 for the subject', async () => {
    const exam = await adapter().createExam('s-1', INPUT)
    expect(exam).toMatchObject({ ...INPUT, subjectId: 's-1', version: 1 })
    expect(exam.id).toBeTruthy()
  })

  it('createExam rejects a duplicate name in the same subject, ignoring case and spaces', async () => {
    const service = adapter()
    await service.createExam('s-1', INPUT)
    const error = await service.createExam('s-1', { ...INPUT, name: '  saa-c03 ' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ExamsConflictError)
    expect((error as ExamsConflictError).rule).toBe('duplicate_name')
  })

  it('createExam accepts the same name in another subject', async () => {
    const service = adapter()
    await service.createExam('s-1', INPUT)
    await expect(service.createExam('s-2', INPUT)).resolves.toMatchObject({ subjectId: 's-2' })
  })

  it('createExam reports one range violation per field', async () => {
    const error = await adapter()
      .createExam('s-1', { name: 'X', questionCount: 0, timeLimitMin: 601, passPercent: 101 })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect((error as ExamsValidationError).details.map((d) => [d.field, d.rule])).toEqual([
      ['questionCount', 'range'],
      ['timeLimitMin', 'range'],
      ['passPercent', 'range'],
    ])
  })
})
