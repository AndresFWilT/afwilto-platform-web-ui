import { describe, it, expect } from 'vitest'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsNotFoundError, ExamsValidationError } from '../../src/exams/application/ports'
import { primaryClassification } from '../../src/exams/domain'
import { CAT, EXAM_ID, examFixture, examsSeedFixture } from './examFixtures'

const adapter = (overrides = {}) => new InMemoryExamsAdapter(examsSeedFixture(overrides))
const failure = (promise: Promise<unknown>) => promise.catch((e: unknown) => e)
const keys = (list: Array<{ key: string }>) => list.map((q) => q.key)

describe('InMemoryExamsAdapter.listQuestions (S04-1, S08-6)', () => {
  it('returns every question of the exam as a summary, ordered by origin set, number, then key', async () => {
    const list = await adapter().listQuestions(EXAM_ID)
    expect(list).toHaveLength(13)
    expect(keys(list)).toEqual(['ren-1', 'ren-2', 'ren-3', 'cos-1', 'cos-2', 'seg-1', 'seg-2', 'seg-3', 'seg-4', 'seg-5', 'sin-1', 'sin-2', 'sin-3'])
    expect(list[0]).toMatchObject({ key: 'ren-1', stemExcerpt: expect.any(String), categories: expect.any(Array) })
    expect(list[0]).not.toHaveProperty('options')
  })

  it('filters by category id', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { category: CAT.seguridad })).sort()).toEqual(['seg-1', 'seg-2', 'seg-3', 'seg-4', 'seg-5'])
  })

  it('filters by text, ignoring case', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { q: 'BUCKET' })).sort()).toEqual(['seg-1', 'seg-2'])
  })

  it('combines filters with AND', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { category: CAT.s3, q: 'bucket' })).sort()).toEqual(['seg-1', 'seg-2'])
    expect(await adapter().listQuestions(EXAM_ID, { category: CAT.vpc, q: 'bucket' })).toEqual([])
  })

  it('filters by origin set, in the order of the set', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { origin: 'TD Set 1' }))).toEqual(['ren-1', 'ren-2'])
  })

  it('filters by difficulty', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { difficulty: 'hard' }))).toEqual(['ren-1'])
  })

  it('filters the questions with no category in the primary classification', async () => {
    expect(keys(await adapter().listQuestions(EXAM_ID, { unclassified: true })).sort()).toEqual(['sin-1', 'sin-2', 'sin-3'])
  })

  it('the excerpt is the first 200 characters of the stem without Markdown syntax', async () => {
    const long = `**Negrita** y ![dibujo](media:${'a1'.repeat(32)}) con [enlace](https://x.test) ${'x'.repeat(300)}`
    const service = adapter({ questions: [{ ...examsSeedFixture().questions![0], stem: long }] })
    const [summary] = await service.listQuestions(EXAM_ID)
    expect(summary.stemExcerpt.length).toBeLessThanOrEqual(200)
    expect(summary.stemExcerpt.startsWith('Negrita')).toBe(true)
    expect(summary.stemExcerpt).not.toMatch(/[*\[\]()!]|media:/)
  })

  it('an unknown exam is not found', async () => {
    expect(await failure(adapter().listQuestions('nope'))).toBeInstanceOf(ExamsNotFoundError)
  })
})

describe('InMemoryExamsAdapter.getQuestion and deleteQuestion (S04-2)', () => {
  it('returns the full question with its options and answer key', async () => {
    const q = await adapter().getQuestion('q-seg-1')
    expect(q.options.map((o) => [o.label, o.correct])).toEqual([['A', false], ['B', true], ['C', false]])
    expect(q.categories).toEqual([{ classification: 'Dominio', name: 'Seguridad' }, { classification: 'Servicio', name: 'Amazon S3' }])
  })

  it('an unknown question is not found', async () => {
    expect(await failure(adapter().getQuestion('nope'))).toBeInstanceOf(ExamsNotFoundError)
    expect(await failure(adapter().deleteQuestion('nope'))).toBeInstanceOf(ExamsNotFoundError)
  })

  it('delete removes the question from the list and the counts, and recomputes inferred weights', async () => {
    const exam = examFixture()
    exam.classifications[0].weightMode = 'inferred'
    const service = new InMemoryExamsAdapter(examsSeedFixture({ exams: [exam] }))
    expect(primaryClassification(await service.getExam(EXAM_ID))!.categories.map((c) => c.weightPercent)).toEqual([50, 30, 20])
    for (const id of ['q-cos-1', 'q-cos-2']) await service.deleteQuestion(id)
    expect(await failure(service.getQuestion('q-cos-1'))).toBeInstanceOf(ExamsNotFoundError)
    const after = await service.getExam(EXAM_ID)
    expect(after.questionTotal).toBe(11)
    expect(primaryClassification(after)!.categories.map((c) => [c.questionCount, c.weightPercent])).toEqual([[5, 63], [3, 37], [0, 0]])
  })
})

// ── the dev importer ─────────────────────────────────────────────────────────

const q = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  type: 'single',
  stem: `Stem ${key}`,
  options: [
    { text: 'uno', correct: true, rationale: 'porque' },
    { text: 'dos', correct: false },
  ],
  ...extra,
})
const jsonFile = (questions: unknown[], name = 'q.json') =>
  new File([JSON.stringify({ format: 'afwilto-questions', formatVersion: 1, questions })], name, { type: 'application/json' })

const empty = () => new InMemoryExamsAdapter({ exams: [examFixture({ classifications: [] })], media: {}, questions: [] })
const three = () => [
  q('aws-1', { categories: { Dominio: ['Seguridad'], Servicio: ['Amazon S3', 'CloudFront'] } }),
  q('aws-2', { categories: { Dominio: ['Rendimiento'], Servicio: ['VPC'] } }),
  q('aws-3', { categories: { Dominio: ['Seguridad'] } }),
]

describe('InMemoryExamsAdapter.importQuestions: the dev importer (AC-1, AC-2)', () => {
  it('a dry run counts the creates, lists the new classifications and categories, and writes nothing', async () => {
    const service = empty()
    const report = await service.importQuestions(EXAM_ID, jsonFile(three()), { dryRun: true })
    expect(report).toMatchObject({ dryRun: true, applied: false, counts: { create: 3, update: 0, unchanged: 0, invalid: 0 }, errors: [], primary: 'Dominio' })
    expect(report.keys.create).toEqual(['aws-1', 'aws-2', 'aws-3'])
    expect(report.newClassifications).toEqual([{ name: 'Dominio' }, { name: 'Servicio' }])
    expect(report.newCategories.map((c) => `${c.classification}/${c.name}`)).toEqual(['Dominio/Seguridad', 'Servicio/Amazon S3', 'Servicio/CloudFront', 'Dominio/Rendimiento', 'Servicio/VPC'])
    expect(report.preview.map((p) => p.key)).toEqual(['aws-1', 'aws-2', 'aws-3'])
    expect((await service.getExam(EXAM_ID)).classifications).toEqual([])
    expect(await service.listQuestions(EXAM_ID)).toEqual([])
  })

  it('the default primary is the first classification every question uses with at most one value', async () => {
    const report = await empty().importQuestions(EXAM_ID, jsonFile([q('a', { categories: { Servicio: ['S3', 'VPC'], Dominio: ['Seguridad'] } })]), { dryRun: true })
    expect(report.primary).toBe('Dominio')
  })

  it('the chosen primary wins on a first import (S08-3)', async () => {
    const report = await empty().importQuestions(EXAM_ID, jsonFile(three()), { dryRun: true, primary: 'Servicio' })
    expect(report.primary).toBe('Servicio')
  })

  it('an exam that already has a primary ignores the option', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('nuevo', { categories: { Dominio: ['Seguridad'] } })]), { dryRun: true, primary: 'Servicio' })
    expect(report.primary).toBe('Dominio')
    expect(report.newClassifications).toEqual([])
  })

  it('an apply stores the questions, builds the classifications and infers the weights', async () => {
    const service = empty()
    const report = await service.importQuestions(EXAM_ID, jsonFile(three()), { dryRun: false })
    expect(report).toMatchObject({ dryRun: false, applied: true, counts: { create: 3 } })
    const exam = await service.getExam(EXAM_ID)
    expect(exam.questionTotal).toBe(3)
    const primary = primaryClassification(exam)!
    expect(primary).toMatchObject({ name: 'Dominio', weightMode: 'inferred' })
    expect(primary.categories.map((c) => [c.name, c.questionCount, c.weightPercent])).toEqual([['Seguridad', 2, 67], ['Rendimiento', 1, 33]])
    expect(exam.classifications[1].name).toBe('Servicio')
    expect((await service.listQuestions(EXAM_ID)).map((s) => s.key).sort()).toEqual(['aws-1', 'aws-2', 'aws-3'])
  })

  it('importing the same file again reports everything unchanged and no new categories (AC-2)', async () => {
    const service = empty()
    await service.importQuestions(EXAM_ID, jsonFile(three()), { dryRun: false })
    const again = await service.importQuestions(EXAM_ID, jsonFile(three()), { dryRun: true })
    expect(again.counts).toEqual({ create: 0, update: 0, unchanged: 3, invalid: 0 })
    expect(again.newCategories).toEqual([])
    expect(again.duplicateStems).toEqual([])
  })

  it('an edited question with the same key is an update that raises its version and keeps its id (AC-8)', async () => {
    const service = empty()
    await service.importQuestions(EXAM_ID, jsonFile(three()), { dryRun: false })
    const [before] = (await service.listQuestions(EXAM_ID)).filter((s) => s.key === 'aws-1')
    const edited = three()
    edited[0] = { ...edited[0], stem: 'Otro texto' }
    const report = await service.importQuestions(EXAM_ID, jsonFile(edited), { dryRun: false })
    expect(report.counts).toMatchObject({ update: 1, unchanged: 2 })
    const after = await service.getQuestion(before.id)
    expect(after).toMatchObject({ stem: 'Otro texto', version: before.version + 1 })
  })

  it('a new category within distance 2 of an existing one carries a similarity warning (AC-3)', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('x', { categories: { Dominio: ['Segurdad'] } })]), { dryRun: true })
    expect(report.newCategories).toEqual([{ classification: 'Dominio', name: 'Segurdad', similarTo: ['Seguridad'] }])
  })

  it('names are matched ignoring case and accents, reusing the existing category', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('x', { categories: { dominio: ['SEGURIDAD'] } })]), { dryRun: true })
    expect(report.newClassifications).toEqual([])
    expect(report.newCategories).toEqual([])
  })

  it('a new key with the same normalized stem as an existing question is a duplicate stem, still created (AC-9)', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('copia', { stem: '  UN BUCKET   público expone datos. ' })]), { dryRun: true })
    expect(report.duplicateStems).toEqual([{ key: 'copia', existingKey: 'seg-1' }])
    expect(report.counts.create).toBe(1)
  })

  it('with manual weights a new primary category weighs 0 and the report warns', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('x', { categories: { Dominio: ['Migración'] } })]), { dryRun: true })
    expect(report.weightsAfter.find((w) => w.category === 'Migración')).toEqual({ category: 'Migración', percent: 0, mode: 'manual' })
    expect(report.weightsAfter.find((w) => w.category === 'Seguridad')?.percent).toBe(40)
    expect(report.warnings.join(' ')).toMatch(/Migración.*no entra al simulacro real hasta que le asignes peso/)
  })

  it('a single question with two correct options is an error at questions[i].options, and an apply writes nothing (AC-4)', async () => {
    const service = empty()
    const bad = q('bad', { options: [{ text: 'a', correct: true }, { text: 'b', correct: true }] })
    const report = await service.importQuestions(EXAM_ID, jsonFile([q('ok'), bad]), { dryRun: false })
    expect(report.applied).toBe(false)
    expect(report.counts).toMatchObject({ invalid: 1 })
    expect(report.errors).toEqual([{ path: 'questions[1].options', rule: 'correct_count', message: expect.any(String) }])
    expect(await service.listQuestions(EXAM_ID)).toEqual([])
  })

  it('two categories in the primary classification is a primary_single_valued error (AC-5)', async () => {
    const report = await adapter().importQuestions(EXAM_ID, jsonFile([q('x', { categories: { Dominio: ['Seguridad', 'Costos'] } })]), { dryRun: true })
    expect(report.errors.map((e) => [e.path, e.rule])).toEqual([['questions[0].categories', 'primary_single_valued']])
  })

  it('a third classification is a too_many_classifications error', async () => {
    const report = await empty().importQuestions(EXAM_ID, jsonFile([q('x', { categories: { A: ['1'], B: ['2'], C: ['3'] } })]), { dryRun: true })
    expect(report.errors.map((e) => e.rule)).toEqual(['too_many_classifications'])
  })

  it('a file that is not JSON is an ExamsValidationError on "file" with rule json', async () => {
    const error = await failure(empty().importQuestions(EXAM_ID, new File(['not json'], 'q.json'), { dryRun: true }))
    expect(error).toBeInstanceOf(ExamsValidationError)
    expect((error as ExamsValidationError).details[0]).toMatchObject({ field: 'file', rule: 'json' })
  })

  it('a .zip is refused: the dev importer cannot read archives (file_type)', async () => {
    const error = await failure(empty().importQuestions(EXAM_ID, new File(['PK'], 'q.zip'), { dryRun: true }))
    expect((error as ExamsValidationError).details[0]).toMatchObject({ field: 'file', rule: 'file_type' })
  })

  it('an unknown exam is not found', async () => {
    expect(await failure(empty().importQuestions('nope', jsonFile(three()), { dryRun: true }))).toBeInstanceOf(ExamsNotFoundError)
  })
})
