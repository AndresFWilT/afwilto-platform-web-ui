import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { ExamsValidationError } from '../../src/exams/application/ports'
import { currentLocation, renderAt } from '../support/renderStudies'
import { InMemoryStudiesAdapter } from '../../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { librarySeed } from '../fixtures'
import { SUBJECT_ID, examsSeedFixture } from './examFixtures'

const URL = `/studies/subjects/${SUBJECT_ID}/exams/new`
const open = (exams = new InMemoryExamsAdapter(examsSeedFixture())) => {
  renderAt(URL, new InMemoryStudiesAdapter(librarySeed()), exams)
  return exams
}
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create exam' }))

describe('NewExamPage (S08-1)', () => {
  it('the name input allows 120 characters, the server limit', async () => {
    open()
    await screen.findByRole('heading', { name: 'New exam' })
    expect(screen.getByLabelText('Name').getAttribute('maxlength')).toBe('120')
  })

  it('a 422 invalid_text on the name and a range on the count land on their fields', async () => {
    const exams = open()
    vi.spyOn(exams, 'createExam').mockRejectedValue(
      new ExamsValidationError([
        { field: 'name', rule: 'invalid_text', message: 'contains NUL' },
        { field: 'questionCount', rule: 'range', message: 'must be between 1 and 200' },
      ])
    )
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', 'AIF-C01')
    submit()
    expect(await screen.findByText('The text contains characters that are not allowed')).toBeTruthy()
    expect(screen.getByText('Must be between 1 and 200')).toBeTruthy()
    expect(screen.queryByText('contains NUL')).toBeNull()
  })

  it('shows the four fields with the defaults 65 / 130 / 72', async () => {
    open()
    expect(await screen.findByRole('heading', { name: 'New exam' })).toBeTruthy()
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Questions in the full simulation') as HTMLInputElement).value).toBe('65')
    expect((screen.getByLabelText('Time limit (min)') as HTMLInputElement).value).toBe('130')
    expect((screen.getByLabelText('Pass mark (%)') as HTMLInputElement).value).toBe('72')
  })

  it('an empty name shows a field error and sends no request (S08-1)', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'New exam' })
    submit()
    const name = screen.getByLabelText('Name')
    expect((await screen.findByRole('alert')).textContent).toBe('The name is required')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(create).not.toHaveBeenCalled()
  })

  it('an out-of-range number shows its error and sends no request', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', 'AIF-C01')
    type('Pass mark (%)', '101')
    submit()
    expect(await screen.findByText('Must be between 1 and 100')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
  })

  it('a 409 duplicate_name shows "An exam with that name already exists" on the name field (S08-1)', async () => {
    open()
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', 'saa-c03')
    submit()
    const error = await screen.findByText('An exam with that name already exists')
    expect(error.closest('div')?.querySelector('input')?.id).toBe(screen.getByLabelText('Name').id)
    expect(currentLocation()).toBe(URL)
  })

  it('a valid form creates the exam in the subject, announces it and opens its overview', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', '  AIF-C01 ')
    type('Questions in the full simulation', '50')
    submit()
    await waitFor(() => expect(create).toHaveBeenCalledWith(SUBJECT_ID, { name: 'AIF-C01', questionCount: 50, timeLimitMin: 130, passPercent: 72 }))
    const [created] = (await exams.listExams(SUBJECT_ID)).filter((e) => e.name === 'AIF-C01')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${created.id}`))
    expect(await screen.findByText('Exam created')).toBeTruthy()
  })

  it('a server-side range violation lands on its field', async () => {
    const exams = open()
    vi.spyOn(exams, 'createExam').mockRejectedValue(new ExamsValidationError([{ field: 'timeLimitMin', rule: 'range', message: 'fuera de rango' }]))
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', 'X')
    submit()
    expect(await screen.findByText('Must be between 1 and 600')).toBeTruthy()
  })

  it('an unexpected failure is shown and the form stays editable', async () => {
    const exams = open()
    vi.spyOn(exams, 'createExam').mockRejectedValue(new Error('database is down'))
    await screen.findByRole('heading', { name: 'New exam' })
    type('Name', 'X')
    submit()
    expect(await screen.findByText('database is down')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Create exam' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Cancel returns to the exams of the subject', async () => {
    open()
    await screen.findByRole('heading', { name: 'New exam' })
    fireEvent.click(screen.getByRole('link', { name: 'Cancel' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${SUBJECT_ID}/exams`))
  })
})
