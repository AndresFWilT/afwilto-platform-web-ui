import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsValidationError } from '../../src/exams/application/ports'
import type { ImportReport } from '../../src/exams/domain'
import { currentLocation, renderAt } from '../support/renderStudies'
import { EXAM_ID, FILE_JSON, examFixture, examsSeedFixture, questionFixture, reportFixture } from './examFixtures'

const URL = `/studies/exams/${EXAM_ID}/import`
const emptyExam = () => new InMemoryExamsAdapter({ exams: [examFixture({ classifications: [] })], media: {}, questions: [] })
const populated = () => new InMemoryExamsAdapter(examsSeedFixture())

function open(exams: InMemoryExamsAdapter, ...reports: ImportReport[]) {
  const spy = vi.spyOn(exams, 'importQuestions')
  reports.forEach((r) => spy.mockResolvedValueOnce(r))
  renderAt(URL, undefined, exams)
  return spy
}
const step1 = () => screen.findByLabelText('Questions file')
async function choose(file: File = FILE_JSON()) {
  fireEvent.change(await step1(), { target: { files: [file] } })
}
const importar = () => screen.getByRole('button', { name: 'Import' }) as HTMLButtonElement
const sectionNames = () => screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))

const twoErrors = reportFixture({
  counts: { create: 1, update: 0, unchanged: 0, invalid: 2 },
  errors: [
    { path: 'questions[3].options', rule: 'correct_count', message: 'un single necesita exactamente 1 opción correcta' },
    { path: 'questions[5].options', rule: 'correct_count', message: 'un single necesita exactamente 1 opción correcta' },
  ],
})

afterEach(() => vi.restoreAllMocks())

describe('ImportWizardPage: step 1, File', () => {
  it('shows the three steps with File current, a file input for .json and .zip and the size hint', async () => {
    open(populated())
    const input = (await step1()) as HTMLInputElement
    expect(input.getAttribute('accept')).toBe('.json,.zip')
    expect(screen.getByText('Accepts .json (up to 10 MiB) or .zip with images (up to 50 MiB).')).toBeTruthy()
    const steps = within(screen.getByRole('list', { name: 'Steps' })).getAllByRole('listitem')
    expect(steps.map((s) => s.textContent)).toEqual(['1. File', '2. Report', '3. Confirm'])
    expect(steps.map((s) => s.getAttribute('aria-current'))).toEqual(['step', null, null])
  })

  it('choosing a file sends a dry run for that file', async () => {
    const file = FILE_JSON()
    const spy = open(populated(), reportFixture())
    await choose(file)
    await waitFor(() => expect(spy).toHaveBeenCalledWith(EXAM_ID, file, { dryRun: true }))
    expect(await screen.findByRole('button', { name: 'Import' })).toBeTruthy()
  })

  it('a file that is neither .json nor .zip is refused without a request', async () => {
    const spy = open(populated())
    await choose(new File(['x'], 'notas.txt'))
    expect(await screen.findByText('Choose a .json or .zip file')).toBeTruthy()
    expect(spy).not.toHaveBeenCalled()
  })

  it('a .json over 10 MiB is refused without a request', async () => {
    const spy = open(populated())
    const big = FILE_JSON()
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 })
    await choose(big)
    expect(await screen.findByText('A .json file can be up to 10 MiB')).toBeTruthy()
    expect(spy).not.toHaveBeenCalled()
  })

  it('an unusable file (the server cannot read it) is explained and the wizard stays on step 1', async () => {
    const exams = populated()
    const spy = open(exams)
    spy.mockRejectedValueOnce(new ExamsValidationError([{ field: 'file', rule: 'json', message: 'el archivo no es JSON válido' }]))
    await choose()
    expect(await screen.findByText('el archivo no es JSON válido')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull()
    expect(screen.getByLabelText('Questions file')).toBeTruthy()
  })
})

describe('ImportWizardPage: step 2, Report (S08-2)', () => {
  it('2 errors list both paths grouped by rule and disable "Import" (S08-2)', async () => {
    open(populated(), twoErrors)
    await choose()
    const errors = within(await screen.findByRole('region', { name: 'Errors' }))
    expect(errors.getByText('correct_count')).toBeTruthy()
    expect(errors.getByText('questions[3].options')).toBeTruthy()
    expect(errors.getByText('questions[5].options')).toBeTruthy()
    expect(errors.getAllByText('un single necesita exactamente 1 opción correcta')).toHaveLength(2)
    expect(importar().disabled).toBe(true)
  })

  it('errors of different rules form different groups', async () => {
    open(populated(), reportFixture({ errors: [
      { path: 'questions[0].options', rule: 'correct_count', message: 'm1' },
      { path: 'questions[1].categories', rule: 'primary_single_valued', message: 'm2' },
    ] }))
    await choose()
    const errors = within(await screen.findByRole('region', { name: 'Errors' }))
    expect(errors.getAllByRole('list', { name: /Rule / }).map((l) => l.getAttribute('aria-label'))).toEqual(['Rule correct_count', 'Rule primary_single_valued'])
  })

  it('0 errors and 3 creates enable "Import" and show the counts (S08-2)', async () => {
    open(populated(), reportFixture())
    await choose()
    expect(await screen.findByText('3 to create')).toBeTruthy()
    expect(screen.getByText('0 to update')).toBeTruthy()
    expect(screen.getByText('0 unchanged')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Errors' })).toBeNull()
    expect(importar().disabled).toBe(false)
  })

  it('nothing to create or update disables "Import" and says why', async () => {
    open(populated(), reportFixture({ counts: { create: 0, update: 0, unchanged: 3, invalid: 0 }, keys: { create: [], update: [], unchanged: ['a', 'b', 'c'] } }))
    await choose()
    expect(await screen.findByText('Nothing to import: all the questions are already in the bank.')).toBeTruthy()
    expect(importar().disabled).toBe(true)
  })

  it('shows the sections in the order of the spec', async () => {
    const full = reportFixture({
      errors: [],
      newClassifications: [{ name: 'Dominio' }, { name: 'Servicio' }],
      primary: 'Dominio',
      newCategories: [{ classification: 'Dominio', name: 'Seguridad', similarTo: [] }],
      weightsAfter: [{ category: 'Seguridad', percent: 100, mode: 'inferred' }],
      duplicateStems: [{ key: 'copia', existingKey: 'orig' }],
      media: { referenced: 2, inZip: 1, missing: ['img/falta.png'], unused: ['img/sobra.png'] },
      preview: [questionFixture('p1', [], { explanation: undefined })],
    })
    open(emptyExam(), full)
    await choose()
    await screen.findByRole('region', { name: 'Preview' })
    expect(sectionNames()).toEqual(['Counts', 'New classifications', 'New categories', 'Resulting weights', 'Duplicates', 'Media', 'Preview'])
  })

  it('errors come first when there are any', async () => {
    open(populated(), twoErrors)
    await choose()
    await screen.findByRole('region', { name: 'Errors' })
    expect(sectionNames()[0]).toBe('Errors')
    expect(sectionNames()[1]).toBe('Counts')
  })

  it('"Choose another file" goes back to step 1', async () => {
    open(populated(), reportFixture())
    await choose()
    fireEvent.click(await screen.findByRole('button', { name: 'Choose another file' }))
    expect(await step1()).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull()
  })
})

describe('ImportWizardPage: new classifications and the primary (S08-3)', () => {
  const first = reportFixture({
    primary: 'Dominio',
    newClassifications: [{ name: 'Dominio' }, { name: 'Servicio' }],
    newCategories: [{ classification: 'Dominio', name: 'Seguridad', similarTo: [] }],
  })

  it('on a first import a radio list sets the primary, defaulting to the server choice', async () => {
    open(emptyExam(), first)
    await choose()
    const group = await screen.findByRole('radiogroup', { name: 'Primary classification' })
    expect((within(group).getByRole('radio', { name: 'Dominio' }) as HTMLInputElement).checked).toBe(true)
    expect((within(group).getByRole('radio', { name: 'Servicio' }) as HTMLInputElement).checked).toBe(false)
  })

  it('changing the primary from "Dominio" to "Servicio" sends a second dry run with primary=Servicio (S08-3)', async () => {
    const file = FILE_JSON()
    const spy = open(emptyExam(), first, { ...first, primary: 'Servicio' })
    await choose(file)
    fireEvent.click(await screen.findByRole('radio', { name: 'Servicio' }))
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    expect(spy).toHaveBeenNthCalledWith(1, EXAM_ID, file, { dryRun: true })
    expect(spy).toHaveBeenNthCalledWith(2, EXAM_ID, file, { dryRun: true, primary: 'Servicio' })
    await waitFor(() => expect((screen.getByRole('radio', { name: 'Servicio' }) as HTMLInputElement).checked).toBe(true))
  })

  it('when the exam already has a primary, the new classifications are a plain list and nothing is asked', async () => {
    open(populated(), reportFixture({ primary: 'Dominio', newClassifications: [] }))
    await choose()
    await screen.findByRole('button', { name: 'Import' })
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByRole('region', { name: 'New classifications' })).toBeNull()
  })
})

describe('ImportWizardPage: categories, weights, duplicates, media', () => {
  it('lists new categories with their "is similar to" warnings', async () => {
    open(populated(), reportFixture({ newCategories: [
      { classification: 'Dominio', name: 'Alto rendimeinto', similarTo: ['Alto rendimiento'] },
      { classification: 'Servicio', name: 'Lambda', similarTo: [] },
    ] }))
    await choose()
    const section = within(await screen.findByRole('region', { name: 'New categories' }))
    expect(section.getByText('Dominio / Alto rendimeinto')).toBeTruthy()
    expect(section.getByText('“Alto rendimeinto” is similar to “Alto rendimiento”')).toBeTruthy()
    expect(section.getByText('Servicio / Lambda')).toBeTruthy()
    expect(section.getAllByText(/is similar to/)).toHaveLength(1)
  })

  it('with manual weights, new categories get a callout saying they weigh 0', async () => {
    open(populated(), reportFixture({ newCategories: [{ classification: 'Dominio', name: 'Migración', similarTo: [] }] }))
    await choose()
    expect(await screen.findByText(/start with weight 0 until you assign one/)).toBeTruthy()
  })

  it('with inferred weights there is no such callout', async () => {
    const exam = examFixture()
    exam.classifications[0].weightMode = 'inferred'
    open(new InMemoryExamsAdapter(examsSeedFixture({ exams: [exam] })), reportFixture({ newCategories: [{ classification: 'Dominio', name: 'Migración', similarTo: [] }] }))
    await choose()
    await screen.findByRole('region', { name: 'New categories' })
    expect(screen.queryByText(/start with weight 0/)).toBeNull()
  })

  it('shows the weights after, with their mode, and the server warnings', async () => {
    open(populated(), reportFixture({
      weightsAfter: [{ category: 'Seguridad', percent: 46, mode: 'inferred' }, { category: 'Migración', percent: 0, mode: 'manual' }],
      warnings: ['"Migración" is not part of the full simulation until you assign it a weight'],
    }))
    await choose()
    const section = within(await screen.findByRole('region', { name: 'Resulting weights' }))
    expect(section.getByText('Seguridad: 46% (inferred)')).toBeTruthy()
    expect(section.getByText('Migración: 0% (manual)')).toBeTruthy()
    expect(section.getByText('"Migración" is not part of the full simulation until you assign it a weight')).toBeTruthy()
  })

  it('lists duplicate stems naming both keys', async () => {
    open(populated(), reportFixture({ duplicateStems: [{ key: 'td-timed-3-q1', existingKey: 'td-review-3-q1' }] }))
    await choose()
    const section = within(await screen.findByRole('region', { name: 'Duplicates' }))
    expect(section.getByText('“td-timed-3-q1” has the same stem as “td-review-3-q1”')).toBeTruthy()
  })

  it('lists missing and unused media', async () => {
    open(populated(), reportFixture({ media: { referenced: 3, inZip: 2, missing: ['img/falta.png'], unused: ['img/sobra.png'] } }))
    await choose()
    const section = within(await screen.findByRole('region', { name: 'Media' }))
    expect(section.getByText('3 referenced · 2 in the zip')).toBeTruthy()
    expect(section.getByText('Missing: img/falta.png')).toBeTruthy()
    expect(section.getByText('Unused: img/sobra.png')).toBeTruthy()
  })

  it('shows no media section when the file has no media at all', async () => {
    open(populated(), reportFixture())
    await choose()
    await screen.findByRole('button', { name: 'Import' })
    expect(screen.queryByRole('region', { name: 'Media' })).toBeNull()
  })
})

describe('ImportWizardPage: preview', () => {
  it('renders the first 5 questions with QuestionView in reveal mode', async () => {
    const preview = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((k) => questionFixture(k))
    open(populated(), reportFixture({ preview }))
    await choose()
    const section = within(await screen.findByRole('region', { name: 'Preview' }))
    const articles = section.getAllByRole('article')
    expect(articles).toHaveLength(5)
    expect(within(articles[0]).getByText('Pregunta p1: ¿cuál opción es correcta?')).toBeTruthy()
    expect(within(articles[0]).getByText('Correct')).toBeTruthy()
    expect(within(articles[0]).getByText('Sí: B es correcta.')).toBeTruthy()
    expect(within(articles[0]).getByText('Explicación de p1.')).toBeTruthy()
  })
})

describe('ImportWizardPage: step 3, Confirm', () => {
  async function toConfirm(exams: InMemoryExamsAdapter, ...reports: ImportReport[]) {
    const file = FILE_JSON()
    const spy = open(exams, ...reports)
    await choose(file)
    fireEvent.click(await screen.findByRole('button', { name: 'Import' }))
    return { spy, file }
  }

  it('"Import" moves to Confirm, which summarizes what will happen', async () => {
    await toConfirm(populated(), reportFixture({ counts: { create: 3, update: 2, unchanged: 1, invalid: 0 } }))
    expect(await screen.findByRole('button', { name: 'Confirm import' })).toBeTruthy()
    expect(screen.getByText('3 questions will be created and 2 updated. 1 is already up to date.')).toBeTruthy()
    const steps = within(screen.getByRole('list', { name: 'Steps' })).getAllByRole('listitem')
    expect(steps.map((s) => s.getAttribute('aria-current'))).toEqual([null, null, 'step'])
  })

  it('"Back" returns to the report', async () => {
    await toConfirm(populated(), reportFixture())
    fireEvent.click(await screen.findByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('button', { name: 'Import' })).toBeTruthy()
  })

  it('confirming applies the same file with the chosen primary, toasts the counts and opens the overview', async () => {
    const dry = reportFixture({ primary: 'Dominio', newClassifications: [{ name: 'Dominio' }, { name: 'Servicio' }] })
    const applied = { ...dry, dryRun: false, applied: true, counts: { create: 3, update: 1, unchanged: 2, invalid: 0 } }
    const exams = emptyExam()
    const file = FILE_JSON()
    const spy = open(exams, dry, { ...dry, primary: 'Servicio' }, applied)
    await choose(file)
    fireEvent.click(await screen.findByRole('radio', { name: 'Servicio' }))
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    await waitFor(() => expect((screen.getByRole('radio', { name: 'Servicio' }) as HTMLInputElement).checked).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }))
    await waitFor(() => expect(spy).toHaveBeenNthCalledWith(3, EXAM_ID, file, { dryRun: false, primary: 'Servicio' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${EXAM_ID}`))
    expect(await screen.findByText('Import complete: 3 created, 1 updated, 2 unchanged')).toBeTruthy()
  })

  it('when the exam already has a primary the apply sends no primary', async () => {
    const applied = reportFixture({ dryRun: false, applied: true })
    const { spy, file } = await toConfirm(populated(), reportFixture({ primary: 'Dominio' }), applied)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }))
    await waitFor(() => expect(spy).toHaveBeenNthCalledWith(2, EXAM_ID, file, { dryRun: false }))
  })

  it('a refused apply (422 with a report) returns to the report with the new errors', async () => {
    const refused = { ...twoErrors, dryRun: false, applied: false }
    await toConfirm(populated(), reportFixture(), refused)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }))
    const errors = within(await screen.findByRole('region', { name: 'Errors' }))
    expect(errors.getByText('questions[3].options')).toBeTruthy()
    expect(importar().disabled).toBe(true)
    expect(currentLocation()).toBe(URL)
  })

  it('an apply that fails outright shows the message and keeps the confirmation', async () => {
    const { spy } = await toConfirm(populated(), reportFixture())
    spy.mockRejectedValueOnce(new Error('database is down'))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }))
    expect(await screen.findByText('database is down')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Confirm import' }) as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('ImportWizardPage with the in-memory importer', () => {
  it('imports a real file end to end into an empty exam', async () => {
    const exams = emptyExam()
    renderAt(URL, undefined, exams)
    const qs = ['a', 'b', 'c'].map((k) => ({
      key: `aws-${k}`, type: 'single', stem: `Stem ${k}`, categories: { Dominio: ['Seguridad'], Servicio: ['Amazon S3'] },
      options: [{ text: 'uno', correct: true }, { text: 'dos', correct: false }],
    }))
    await choose(new File([JSON.stringify({ format: 'afwilto-questions', formatVersion: 1, questions: qs })], 'q.json'))
    expect(await screen.findByText('3 to create')).toBeTruthy()
    expect(await screen.findByRole('radio', { name: 'Dominio' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm import' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${EXAM_ID}`))
    expect(await exams.listQuestions(EXAM_ID)).toHaveLength(3)
  })
})
