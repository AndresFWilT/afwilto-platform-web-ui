import { describe, it, expect } from 'vitest'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsConflictError, ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import { primaryClassification, unclassifiedCount, type Exam } from '../../src/exams/domain'
import { CAT, CLS, EXAM_ID, SUBJECT_ID, examFixture, examsSeedFixture, questionFixture } from './examFixtures'

const adapter = (overrides = {}) => new InMemoryExamsAdapter(examsSeedFixture(overrides))
const cat = (exam: Exam, id: string) => exam.classifications.flatMap((c) => c.categories).find((c) => c.id === id)
const failure = (promise: Promise<unknown>) => promise.catch((e: unknown) => e)

describe('InMemoryExamsAdapter: reading exams', () => {
  it('listExams returns the alive exams of the subject ordered by name, with the question total', async () => {
    const service = adapter({ exams: [examFixture({ id: 'e2', name: 'AIF-C01' }), examFixture(), examFixture({ id: 'e3', subjectId: 'other', name: 'Z' })] })
    const list = await service.listExams(SUBJECT_ID)
    expect(list.map((e) => [e.name, e.questionTotal])).toEqual([['AIF-C01', 0], ['SAA-C03', 13]])
    expect(list[0]).not.toHaveProperty('classifications')
  })

  it('getExam derives the counts from the bank: totals, categories and "sin clasificar"', async () => {
    const exam = await adapter().getExam(EXAM_ID)
    expect(exam.questionTotal).toBe(13)
    expect(primaryClassification(exam)?.categories.map((c) => [c.name, c.questionCount, c.weightPercent])).toEqual([
      ['Seguridad', 5, 40],
      ['Rendimiento', 3, 40],
      ['Costos', 2, 20],
    ])
    expect(exam.classifications[1].categories.map((c) => [c.name, c.questionCount, c.weightPercent])).toEqual([
      ['Amazon S3', 5, null],
      ['Storage', 2, null],
      ['VPC', 3, null],
    ])
    expect(unclassifiedCount(exam)).toBe(3)
  })

  it('getExam of an unknown id is an ExamsNotFoundError', async () => {
    expect(await failure(adapter().getExam('nope'))).toBeInstanceOf(ExamsNotFoundError)
  })

  it('returns copies: editing a result does not change the service', async () => {
    const service = adapter()
    const exam = await service.getExam(EXAM_ID)
    exam.name = 'changed'
    exam.classifications[0].categories[0].name = 'changed'
    const again = await service.getExam(EXAM_ID)
    expect(again.name).toBe('SAA-C03')
    expect(again.classifications[0].categories[0].name).toBe('Seguridad')
  })

  it('listAttempts is empty by default and returns the seeded history', async () => {
    expect(await adapter().listAttempts(EXAM_ID)).toEqual({ attempts: [], trend: [] })
    const history = { attempts: [], trend: [{ at: '2026-10-22T10:00:00Z', scorePercent: 70 }] }
    expect(await adapter({ attempts: { [EXAM_ID]: history } }).listAttempts(EXAM_ID)).toEqual(history)
  })

  it('exportUrl is a JSON data URL of the bank in the import format', async () => {
    const url = adapter().exportUrl(EXAM_ID)
    expect(url.startsWith('data:application/json')).toBe(true)
    const body = JSON.parse(decodeURIComponent(url.slice(url.indexOf(',') + 1)))
    expect(body.format).toBe('afwilto-questions')
    expect(body.questions.map((q: { key: string }) => q.key)).toContain('seg-1')
  })
})

describe('InMemoryExamsAdapter.updateExam', () => {
  it('applies the parameters, increments the version and keeps the rest', async () => {
    const service = adapter()
    const updated = await service.updateExam(EXAM_ID, { version: 1, name: ' SAA-C04 ', questionCount: 50, timeLimitMin: 100, passPercent: 70 })
    expect(updated).toMatchObject({ name: 'SAA-C04', questionCount: 50, timeLimitMin: 100, passPercent: 70, version: 2 })
    expect((await service.getExam(EXAM_ID)).version).toBe(2)
  })

  it('a stale version is a conflict with rule stale_version and changes nothing', async () => {
    const service = adapter()
    const error = await failure(service.updateExam(EXAM_ID, { version: 7, name: 'X' }))
    expect(error).toBeInstanceOf(ExamsConflictError)
    expect((error as ExamsConflictError).rule).toBe('stale_version')
    expect((await service.getExam(EXAM_ID)).name).toBe('SAA-C03')
  })

  it('renaming to the name of another exam of the subject is duplicate_name on "name"', async () => {
    const service = adapter({ exams: [examFixture(), examFixture({ id: 'e2', name: 'Otro' })] })
    const error = await failure(service.updateExam('e2', { version: 1, name: ' saa-c03' }))
    expect((error as ExamsConflictError).rule).toBe('duplicate_name')
    expect((error as ExamsConflictError).field).toBe('name')
  })

  it('keeping the same name is not a duplicate', async () => {
    await expect(adapter().updateExam(EXAM_ID, { version: 1, name: 'SAA-C03', passPercent: 80 })).resolves.toMatchObject({ passPercent: 80 })
  })

  it('out-of-range parameters are one range violation per field', async () => {
    const error = await failure(adapter().updateExam(EXAM_ID, { version: 1, questionCount: 0, passPercent: 101 }))
    expect((error as ExamsValidationError).details.map((d) => [d.field, d.rule])).toEqual([['questionCount', 'range'], ['passPercent', 'range']])
  })

  it('weights that sum to 100 are stored and switch the mode to manual', async () => {
    const service = adapter({ exams: [examFixture({ classifications: [{ ...examFixture().classifications[0], weightMode: 'inferred' }, examFixture().classifications[1]] })] })
    const updated = await service.updateExam(EXAM_ID, {
      version: 1,
      weights: [{ categoryId: CAT.seguridad, percent: 30 }, { categoryId: CAT.rendimiento, percent: 30 }, { categoryId: CAT.costos, percent: 40 }],
    })
    const primary = primaryClassification(updated)!
    expect(primary.weightMode).toBe('manual')
    expect(primary.categories.map((c) => c.weightPercent)).toEqual([30, 30, 40])
  })

  it('weights that sum to 99 are a weights_sum violation and nothing is saved (S08-4)', async () => {
    const service = adapter()
    const error = await failure(
      service.updateExam(EXAM_ID, { version: 1, name: 'No', weights: [{ categoryId: CAT.seguridad, percent: 40 }, { categoryId: CAT.rendimiento, percent: 40 }, { categoryId: CAT.costos, percent: 19 }] })
    )
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect((error as ExamsValidationError).details[0]).toMatchObject({ field: 'weights', rule: 'weights_sum' })
    const exam = await service.getExam(EXAM_ID)
    expect(exam.name).toBe('SAA-C03')
    expect(exam.version).toBe(1)
  })

  it('weights that skip an alive primary category are a weights_sum violation', async () => {
    const error = await failure(adapter().updateExam(EXAM_ID, { version: 1, weights: [{ categoryId: CAT.seguridad, percent: 60 }, { categoryId: CAT.rendimiento, percent: 40 }] }))
    expect((error as ExamsValidationError).details[0].rule).toBe('weights_sum')
  })

  it('weightMode "inferred" drops the manual weights and recomputes them from the bank (5/3/2)', async () => {
    const updated = await adapter().updateExam(EXAM_ID, { version: 1, weightMode: 'inferred' })
    const primary = primaryClassification(updated)!
    expect(primary.weightMode).toBe('inferred')
    expect(primary.categories.map((c) => c.weightPercent)).toEqual([50, 30, 20])
  })

  it('renames classifications and categories', async () => {
    const updated = await adapter().updateExam(EXAM_ID, {
      version: 1,
      classifications: [{ id: CLS.dominio, name: 'Área' }],
      categories: [{ id: CAT.seguridad, name: 'Seguridad y cumplimiento' }],
    })
    expect(updated.classifications[0].name).toBe('Área')
    expect(cat(updated, CAT.seguridad)?.name).toBe('Seguridad y cumplimiento')
  })

  it('renaming a category to another one of the same classification, ignoring case and accents, is duplicate_name', async () => {
    const error = await failure(adapter().updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.costos, name: 'SEGURIDAD' }] }))
    expect((error as ExamsConflictError).rule).toBe('duplicate_name')
  })

  it('a rename that is followed by a failure in the same update changes nothing, not even the question links', async () => {
    const service = adapter()
    const error = await failure(
      service.updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.seguridad, name: 'Seguridad 2' }, { id: CAT.vpc, paceQuestions: 3 }] })
    )
    expect(error).toBeInstanceOf(ExamsValidationError)
    await service.updateExam(EXAM_ID, { version: 1, name: 'Otro nombre' })
    const exam = await service.getExam(EXAM_ID)
    expect(cat(exam, CAT.seguridad)).toMatchObject({ name: 'Seguridad', questionCount: 5 })
  })

  it('renaming a category keeps its questions linked', async () => {
    const renamed = await adapter().updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.seguridad, name: 'Seguridad y cumplimiento' }] })
    expect(cat(renamed, CAT.seguridad)?.questionCount).toBe(5)
  })

  it('a pace needs both values or neither; null clears it', async () => {
    const service = adapter()
    const bad = await failure(service.updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.vpc, paceQuestions: 10 }] }))
    expect((bad as ExamsValidationError).details[0]).toMatchObject({ rule: 'pace_pair' })

    const set = await service.updateExam(EXAM_ID, { version: 1, categories: [{ id: CAT.vpc, paceQuestions: 10, paceMinutes: 20 }] })
    expect(cat(set, CAT.vpc)).toMatchObject({ paceQuestions: 10, paceMinutes: 20 })

    const cleared = await service.updateExam(EXAM_ID, { version: 2, categories: [{ id: CAT.vpc, paceQuestions: null, paceMinutes: null }] })
    expect(cat(cleared, CAT.vpc)).toMatchObject({ paceQuestions: null, paceMinutes: null })
  })

  it('swapping the primary makes the other classification position 0, resets to inferred and weighs it from the bank', async () => {
    const updated = await adapter().updateExam(EXAM_ID, { version: 1, primaryClassificationId: CLS.servicio })
    expect(primaryClassification(updated)?.name).toBe('Servicio')
    expect(primaryClassification(updated)?.weightMode).toBe('inferred')
    expect(primaryClassification(updated)?.categories.map((c) => c.weightPercent)).toEqual([50, 20, 30])
    expect(updated.classifications.find((c) => c.name === 'Dominio')?.categories.map((c) => c.weightPercent)).toEqual([null, null, null])
  })

  it('swapping is refused when a question has two categories in the would-be primary (primary_single_valued)', async () => {
    const two = questionFixture('dos', [['Servicio', 'Amazon S3'], ['Servicio', 'VPC']])
    const service = new InMemoryExamsAdapter(examsSeedFixture({ questions: [two] }))
    const error = await failure(service.updateExam(EXAM_ID, { version: 1, primaryClassificationId: CLS.servicio }))
    expect((error as ExamsValidationError).details[0]).toMatchObject({ rule: 'primary_single_valued' })
  })

  it('updating an unknown exam is not found', async () => {
    expect(await failure(adapter().updateExam('nope', { version: 1 }))).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('InMemoryExamsAdapter.deleteExam', () => {
  it('is blocked by alive questions with rule in_use', async () => {
    const error = await failure(adapter().deleteExam(EXAM_ID))
    expect((error as ExamsConflictError).rule).toBe('in_use')
  })

  it('removes an exam with no questions', async () => {
    const service = adapter({ questions: [] })
    await service.deleteExam(EXAM_ID)
    expect(await failure(service.getExam(EXAM_ID))).toBeInstanceOf(ExamsNotFoundError)
    expect(await service.listExams(SUBJECT_ID)).toEqual([])
  })

  it('an unknown exam is not found', async () => {
    expect(await failure(adapter().deleteExam('nope'))).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('InMemoryExamsAdapter.mergeCategories (S04-6)', () => {
  it('moves the questions into the surviving category and drops the other', async () => {
    const merged = await adapter().mergeCategories(EXAM_ID, { from: CAT.storage, into: CAT.s3 })
    expect(cat(merged, CAT.storage)).toBeUndefined()
    expect(cat(merged, CAT.s3)?.questionCount).toBe(7)
    expect(merged.version).toBe(2)
  })

  it('a question that had both ends keeps a single link', async () => {
    const both = questionFixture('ambas', [['Servicio', 'Amazon S3'], ['Servicio', 'Storage']])
    const service = new InMemoryExamsAdapter(examsSeedFixture({ questions: [both] }))
    const merged = await service.mergeCategories(EXAM_ID, { from: CAT.storage, into: CAT.s3 })
    expect(cat(merged, CAT.s3)?.questionCount).toBe(1)
    expect(merged.questionTotal).toBe(1)
  })

  it('with manual weights, "into" absorbs the percent of "from"', async () => {
    const merged = await adapter().mergeCategories(EXAM_ID, { from: CAT.costos, into: CAT.seguridad })
    expect(primaryClassification(merged)!.categories.map((c) => [c.name, c.weightPercent])).toEqual([['Seguridad', 60], ['Rendimiento', 40]])
  })

  it('with inferred weights, they are recomputed from the bank', async () => {
    const exam = examFixture()
    exam.classifications[0].weightMode = 'inferred'
    const merged = await new InMemoryExamsAdapter(examsSeedFixture({ exams: [exam] })).mergeCategories(EXAM_ID, { from: CAT.costos, into: CAT.rendimiento })
    expect(primaryClassification(merged)!.categories.map((c) => [c.name, c.weightPercent])).toEqual([['Seguridad', 50], ['Rendimiento', 50]])
  })

  it('categories of different classifications, or an unknown one, are a merge_scope violation', async () => {
    const service = adapter()
    for (const input of [{ from: CAT.s3, into: CAT.seguridad }, { from: 'nope', into: CAT.s3 }, { from: CAT.s3, into: CAT.s3 }]) {
      const error = await failure(service.mergeCategories(EXAM_ID, input))
      expect((error as ExamsValidationError).details[0]).toMatchObject({ rule: 'merge_scope' })
    }
  })
})
