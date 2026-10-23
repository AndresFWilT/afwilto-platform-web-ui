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
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Crear examen' }))

describe('NewExamPage (S08-1)', () => {
  it('shows the four fields with the defaults 65 / 130 / 72', async () => {
    open()
    expect(await screen.findByRole('heading', { name: 'Nuevo examen' })).toBeTruthy()
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Preguntas del simulacro') as HTMLInputElement).value).toBe('65')
    expect((screen.getByLabelText('Tiempo límite (min)') as HTMLInputElement).value).toBe('130')
    expect((screen.getByLabelText('Aprobado con (%)') as HTMLInputElement).value).toBe('72')
  })

  it('an empty name shows a field error and sends no request (S08-1)', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    submit()
    const name = screen.getByLabelText('Nombre')
    expect((await screen.findByRole('alert')).textContent).toBe('El nombre es obligatorio')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(create).not.toHaveBeenCalled()
  })

  it('an out-of-range number shows its error and sends no request', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    type('Nombre', 'AIF-C01')
    type('Aprobado con (%)', '101')
    submit()
    expect(await screen.findByText('Debe estar entre 1 y 100')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
  })

  it('a 409 duplicate_name shows "Ya existe un examen con ese nombre" on the name field (S08-1)', async () => {
    open()
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    type('Nombre', 'saa-c03')
    submit()
    const error = await screen.findByText('Ya existe un examen con ese nombre')
    expect(error.closest('div')?.querySelector('input')?.id).toBe(screen.getByLabelText('Nombre').id)
    expect(currentLocation()).toBe(URL)
  })

  it('a valid form creates the exam in the subject, announces it and opens its overview', async () => {
    const exams = open()
    const create = vi.spyOn(exams, 'createExam')
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    type('Nombre', '  AIF-C01 ')
    type('Preguntas del simulacro', '50')
    submit()
    await waitFor(() => expect(create).toHaveBeenCalledWith(SUBJECT_ID, { name: 'AIF-C01', questionCount: 50, timeLimitMin: 130, passPercent: 72 }))
    const [created] = (await exams.listExams(SUBJECT_ID)).filter((e) => e.name === 'AIF-C01')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/exams/${created.id}`))
    expect(await screen.findByText('Examen creado')).toBeTruthy()
  })

  it('a server-side range violation lands on its field', async () => {
    const exams = open()
    vi.spyOn(exams, 'createExam').mockRejectedValue(new ExamsValidationError([{ field: 'timeLimitMin', rule: 'range', message: 'fuera de rango' }]))
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    type('Nombre', 'X')
    submit()
    expect(await screen.findByText('fuera de rango')).toBeTruthy()
  })

  it('an unexpected failure is shown and the form stays editable', async () => {
    const exams = open()
    vi.spyOn(exams, 'createExam').mockRejectedValue(new Error('database is down'))
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    type('Nombre', 'X')
    submit()
    expect(await screen.findByText('database is down')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Crear examen' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Cancelar returns to the exams of the subject', async () => {
    open()
    await screen.findByRole('heading', { name: 'Nuevo examen' })
    fireEvent.click(screen.getByRole('link', { name: 'Cancelar' }))
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${SUBJECT_ID}/exams`))
  })
})
