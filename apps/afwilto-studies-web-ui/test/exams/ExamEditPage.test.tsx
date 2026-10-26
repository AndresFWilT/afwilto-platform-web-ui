import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsConflictError, ExamsValidationError } from '../../src/exams/application/ports'
import { currentLocation, renderAt } from '../support/renderStudies'
import { choose, findDialog } from '../support/forms'
import { CAT, CLS, EXAM_ID, examsSeedFixture } from './examFixtures'

const URL = `/studies/exams/${EXAM_ID}/edit`
const open = (exams = new InMemoryExamsAdapter(examsSeedFixture())) => {
  renderAt(URL, undefined, exams)
  return exams
}
const loaded = () => screen.findByRole('heading', { level: 1, name: 'Edit exam' })
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const save = () => screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement
const value = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value

afterEach(() => vi.restoreAllMocks())

describe('ExamEditPage: loading', () => {
  it('prefills the parameters, names, pace, weights and the live sum, with save disabled', async () => {
    open()
    await loaded()
    expect(value('Name')).toBe('SAA-C03')
    expect(value('Questions in the full simulation')).toBe('65')
    expect(value('Name of the primary classification')).toBe('Dominio')
    expect(value('Name of the secondary classification')).toBe('Servicio')
    expect(value('Name of “Seguridad”')).toBe('Seguridad')
    expect(value('Weight of “Seguridad”')).toBe('40')
    expect(value('Pace: questions of “Seguridad”')).toBe('')
    expect(screen.getByText('Total: 100 / 100')).toBeTruthy()
    expect(save().disabled).toBe(true)
  })

  it('an unknown exam says so', async () => {
    renderAt('/studies/exams/zzzz/edit', undefined, new InMemoryExamsAdapter(examsSeedFixture()))
    expect(await screen.findByText('Exam not found')).toBeTruthy()
  })

  it('Cancel goes back to the overview', async () => {
    open()
    await loaded()
    fireEvent.click(screen.getByRole('link', { name: 'Cancel' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${EXAM_ID}`))
  })
})

describe('ExamEditPage: weights (S08-4)', () => {
  it('weights that sum to 99 show "Total: 99 / 100" and keep save disabled; reaching 100 enables it', async () => {
    open()
    await loaded()
    type('Weight of “Costos”', '19')
    expect(screen.getByText('Total: 99 / 100')).toBeTruthy()
    expect(save().disabled).toBe(true)
    type('Weight of “Costos”', '20')
    type('Weight of “Seguridad”', '39')
    type('Weight of “Rendimiento”', '41')
    expect(screen.getByText('Total: 100 / 100')).toBeTruthy()
    expect(save().disabled).toBe(false)
  })

  it('saving the weights sends only them with the version, announces it and opens the overview', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    type('Weight of “Seguridad”', '30')
    type('Weight of “Costos”', '30')
    fireEvent.click(save())
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(EXAM_ID, {
        version: 1,
        weights: [{ categoryId: CAT.seguridad, percent: 30 }, { categoryId: CAT.rendimiento, percent: 40 }, { categoryId: CAT.costos, percent: 30 }],
      })
    )
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${EXAM_ID}`))
    expect(await screen.findByText('Changes saved')).toBeTruthy()
  })

  it('"Back to inferred" sends weightMode "inferred" and shows the weights from the bank (S08-4)', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    fireEvent.click(screen.getByRole('button', { name: 'Back to inferred' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(EXAM_ID, { version: 1, weightMode: 'inferred' }))
    await waitFor(() => expect(value('Weight of “Seguridad”')).toBe('50'))
    expect(value('Weight of “Rendimiento”')).toBe('30')
    expect(screen.queryByRole('button', { name: 'Back to inferred' })).toBeNull()
  })

  it('"Back to inferred" keeps the other edits the user has typed', async () => {
    open()
    await loaded()
    type('Pass mark (%)', '80')
    fireEvent.click(screen.getByRole('button', { name: 'Back to inferred' }))
    await waitFor(() => expect(value('Weight of “Seguridad”')).toBe('50'))
    expect(value('Pass mark (%)')).toBe('80')
  })
})

describe('ExamEditPage: parameters, names and pace', () => {
  it('an empty name shows its error, sends nothing and keeps save disabled', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    type('Name', '')
    expect(await screen.findByText('The name is required')).toBeTruthy()
    expect(save().disabled).toBe(true)
    expect(update).not.toHaveBeenCalled()
  })

  it('sends renamed classifications and categories and a changed parameter in one request', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    type('Pass mark (%)', '80')
    type('Name of the secondary classification', 'Servicios')
    type('Name of “Storage”', 'Almacenamiento')
    fireEvent.click(save())
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(EXAM_ID, {
        version: 1,
        passPercent: 80,
        classifications: [{ id: CLS.servicio, name: 'Servicios' }],
        categories: [{ id: CAT.storage, name: 'Almacenamiento' }],
      })
    )
  })

  it('half a pace pair is flagged and blocks saving; the whole pair is sent', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    type('Pace: questions of “VPC”', '10')
    expect(await screen.findByText('Enter both pace values or neither (whole numbers from 1)')).toBeTruthy()
    expect(save().disabled).toBe(true)
    type('Pace: minutes of “VPC”', '20')
    expect(save().disabled).toBe(false)
    fireEvent.click(save())
    await waitFor(() => expect(update).toHaveBeenCalledWith(EXAM_ID, { version: 1, categories: [{ id: CAT.vpc, paceQuestions: 10, paceMinutes: 20 }] }))
  })

  it('choosing another primary classification hides the weights (they are inferred again) and sends the swap', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    choose(document.body, 'Primary classification', 'Servicio')
    expect(screen.queryByLabelText('Weight of “Seguridad”')).toBeNull()
    expect(screen.getByText('Weights are inferred again when the primary classification changes.')).toBeTruthy()
    fireEvent.click(save())
    await waitFor(() => expect(update).toHaveBeenCalledWith(EXAM_ID, { version: 1, primaryClassificationId: CLS.servicio }))
  })
})

describe('ExamEditPage: server failures', () => {
  it('a 422 range on a pace value lands on its row, not on a generic alert', async () => {
    const exams = open()
    vi.spyOn(exams, 'updateExam').mockRejectedValue(new ExamsValidationError([{ field: 'categories[0].paceQuestions', rule: 'range', message: 'must be between 1 and 10000' }]))
    await loaded()
    type('Pace: questions of “VPC”', '10')
    type('Pace: minutes of “VPC”', '20')
    fireEvent.click(save())
    expect(await screen.findByText('The pace takes whole numbers from 1 to 10,000')).toBeTruthy()
    expect(screen.queryByText(/must be between/)).toBeNull()
  })

  it('a 422 invalid_text on the exam name lands on the name field', async () => {
    const exams = open()
    vi.spyOn(exams, 'updateExam').mockRejectedValue(new ExamsValidationError([{ field: 'name', rule: 'invalid_text', message: 'contains NUL' }]))
    await loaded()
    type('Name', 'SAA-C04')
    fireEvent.click(save())
    expect(await screen.findByText('The text contains characters that are not allowed')).toBeTruthy()
    expect(screen.queryByText('contains NUL')).toBeNull()
  })

  it('the inputs carry the server limits: name 120, classification 40, category 80', async () => {
    open()
    await loaded()
    expect(screen.getByLabelText('Name').getAttribute('maxlength')).toBe('120')
    expect(screen.getByLabelText('Name of the primary classification').getAttribute('maxlength')).toBe('40')
    expect(screen.getByLabelText('Name of “Seguridad”').getAttribute('maxlength')).toBe('80')
  })

  it('a duplicate exam name lands on the name field', async () => {
    const exams = open()
    vi.spyOn(exams, 'updateExam').mockRejectedValue(new ExamsConflictError('name', 'duplicate_name', 'dup'))
    await loaded()
    type('Pass mark (%)', '80')
    fireEvent.click(save())
    expect(await screen.findByText('An exam with that name already exists')).toBeTruthy()
  })

  it('a stale version asks to reload, and reloading shows the latest', async () => {
    const exams = open()
    await loaded()
    await exams.updateExam(EXAM_ID, { version: 1, passPercent: 90 })
    type('Pass mark (%)', '80')
    fireEvent.click(save())
    expect(await screen.findByText('The exam changed while you were editing it. Reload to see the latest version.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    await waitFor(() => expect(value('Pass mark (%)')).toBe('90'))
  })

  it('other violations are shown as an alert', async () => {
    const exams = open()
    vi.spyOn(exams, 'updateExam').mockRejectedValue(new Error('database is down'))
    await loaded()
    type('Pass mark (%)', '80')
    fireEvent.click(save())
    expect(await screen.findByText('database is down')).toBeTruthy()
  })
})

describe('ExamEditPage: merging categories (S08-5)', () => {
  const pick = (from: string, into: string) => {
    choose(document.body, 'Merge from (Servicio)', from)
    choose(document.body, 'Merge into (Servicio)', into)
  }

  it('merging "Storage" into "Amazon S3" asks for confirmation naming both, sends {from, into} and refreshes', async () => {
    const exams = open()
    const merge = vi.spyOn(exams, 'mergeCategories')
    await loaded()
    pick('Storage', 'Amazon S3')
    fireEvent.click(screen.getByRole('button', { name: 'Merge categories of “Servicio”' }))
    const dialog = await findDialog('Merge “Storage” into “Amazon S3”?')
    expect(within(dialog).getByText(/The questions of “Storage” will move to “Amazon S3”/)).toBeTruthy()
    expect(merge).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Merge' }))
    await waitFor(() => expect(merge).toHaveBeenCalledWith(EXAM_ID, { from: CAT.storage, into: CAT.s3 }))
    expect(await screen.findByText('Categories merged')).toBeTruthy()
    await waitFor(() => expect(screen.queryByLabelText('Name of “Storage”')).toBeNull())
    expect(screen.getByLabelText('Name of “Amazon S3”')).toBeTruthy()
    const options = [...(screen.getByLabelText('Merge from (Servicio)') as HTMLSelectElement).options].map((o) => o.textContent)
    expect(options).not.toContain('Storage')
  })

  it('merging keeps working after a merge: the next save uses the new version', async () => {
    const exams = open()
    const update = vi.spyOn(exams, 'updateExam')
    await loaded()
    pick('Storage', 'Amazon S3')
    fireEvent.click(screen.getByRole('button', { name: 'Merge categories of “Servicio”' }))
    fireEvent.click(within(await findDialog('Merge “Storage” into “Amazon S3”?')).getByRole('button', { name: 'Merge' }))
    await screen.findByText('Categories merged')
    type('Pass mark (%)', '80')
    fireEvent.click(save())
    await waitFor(() => expect(update).toHaveBeenCalledWith(EXAM_ID, { version: 2, passPercent: 80 }))
  })

  it('cancelling the confirmation merges nothing', async () => {
    const exams = open()
    const merge = vi.spyOn(exams, 'mergeCategories')
    await loaded()
    pick('Storage', 'Amazon S3')
    fireEvent.click(screen.getByRole('button', { name: 'Merge categories of “Servicio”' }))
    fireEvent.click(within(await findDialog('Merge “Storage” into “Amazon S3”?')).getByRole('button', { name: 'Cancel' }))
    expect(merge).not.toHaveBeenCalled()
  })

  it('the merge button needs two different categories', async () => {
    open()
    await loaded()
    const button = screen.getByRole('button', { name: 'Merge categories of “Servicio”' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    choose(document.body, 'Merge from (Servicio)', 'Storage')
    expect(button.disabled).toBe(true)
    const into = screen.getByLabelText('Merge into (Servicio)') as HTMLSelectElement
    expect([...into.options].map((o) => o.textContent)).not.toContain('Storage')
    choose(document.body, 'Merge into (Servicio)', 'VPC')
    expect(button.disabled).toBe(false)
  })
})
