import { describe, it, expect } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { currentLocation, renderAt } from '../support/renderStudies'
import { EXAM_ID, SUBJECT_ID, examFixture, examsSeedFixture } from './examFixtures'

const URL = `/studies/subjects/${SUBJECT_ID}/exams`
const exams = (overrides = {}) => new InMemoryExamsAdapter(examsSeedFixture(overrides))
const open = (service = exams()) => renderAt(URL, undefined, service)

describe('ExamsPage', () => {
  it('lists each exam with its question count, linking to its overview', async () => {
    open()
    const link = await screen.findByRole('link', { name: 'SAA-C03' })
    expect(link.getAttribute('href')).toBe(`/studies/exams/${EXAM_ID}`)
    const row = link.closest('li')!
    expect(within(row).getByText('13 preguntas')).toBeTruthy()
    expect(within(row).getByText(/65 preguntas · 130 min · aprobado con 72 %/)).toBeTruthy()
  })

  it('shows the last simulation score and whether it passed', async () => {
    const passed = examFixture({ lastSimulation: { scorePercent: 78.5, passed: true, at: '2026-10-20T10:00:00Z' } })
    open(exams({ exams: [passed] }))
    const row = (await screen.findByRole('link', { name: 'SAA-C03' })).closest('li')!
    expect(within(row).getByText('Último simulacro: 78.5 % · Aprobado')).toBeTruthy()
  })

  it('says so when a failed simulation was not passed, and when there is none', async () => {
    open(exams({ exams: [examFixture({ lastSimulation: { scorePercent: 60, passed: false, at: '2026-10-20T10:00:00Z' } }), examFixture({ id: 'e2', name: 'AIF-C01' })] }))
    const failed = (await screen.findByRole('link', { name: 'SAA-C03' })).closest('li')!
    expect(within(failed).getByText('Último simulacro: 60 % · No aprobado')).toBeTruthy()
    const none = screen.getByRole('link', { name: 'AIF-C01' }).closest('li')!
    expect(within(none).getByText('Sin simulacros todavía')).toBeTruthy()
  })

  it('has a "Nuevo examen" link to the creation form', async () => {
    open()
    const link = await screen.findByRole('link', { name: 'Nuevo examen' })
    expect(link.getAttribute('href')).toBe(`/studies/subjects/${SUBJECT_ID}/exams/new`)
    fireEvent.click(link)
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${SUBJECT_ID}/exams/new`))
  })

  it('invites to create the first exam when the subject has none', async () => {
    open(exams({ exams: [] }))
    expect(await screen.findByText('Esta materia aún no tiene exámenes')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Nuevo examen' })).toBeTruthy()
  })

  it('links back to the subject', async () => {
    open()
    expect((await screen.findByRole('link', { name: 'Volver a la materia' })).getAttribute('href')).toBe(`/studies/subjects/${SUBJECT_ID}`)
  })

  it('shows the error when the exams cannot be loaded', async () => {
    const service = exams()
    service.listExams = () => Promise.reject(new Error('backend unreachable'))
    open(service)
    expect(await screen.findByText('backend unreachable')).toBeTruthy()
  })
})
