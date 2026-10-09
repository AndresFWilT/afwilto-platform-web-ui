import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError } from '../src/application/errors'
import { currentLocation, renderAt } from './support/renderStudies'
import { choose, click, errorFor, fieldValue, fill, findDialog, optionTexts } from './support/forms'
import { IDS, librarySeed } from './fixtures'

let confirmSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled()
  confirmSpy.mockRestore()
})

const page = () => document.body
const SUBJECT_URL = `/studies/subjects/${IDS.ccp}`

describe('New subject from the library (S09a-9)', () => {
  it('offers categories by path, requires one, and lands on the new subject', async () => {
    const service = new InMemoryStudiesAdapter(librarySeed())
    const create = vi.spyOn(service, 'createSubject')
    renderAt('/studies', service)
    await screen.findByRole('button', { name: 'New subject' })
    click(page(), 'New subject')
    const dialog = await findDialog('New subject')
    expect(optionTexts(dialog, 'Category')).toEqual(['Choose a category', 'Math', 'TI', 'TI / Cloud', 'TI / Cloud / AWS'])

    fill(dialog, 'Name', 'Linear algebra')
    click(dialog, 'Save')
    expect(within(dialog).getByText('Pick a category')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()

    choose(dialog, 'Category', 'Math')
    click(dialog, 'Save')
    expect(await screen.findByRole('heading', { level: 1, name: 'Linear algebra' })).toBeTruthy()
    expect(create).toHaveBeenCalledWith({ categoryId: IDS.math, name: 'Linear algebra', description: null })
    expect(currentLocation()).toMatch(/^\/studies\/subjects\/[0-9a-f-]{36}$/)
  })

  it('shows a duplicate name under Name', async () => {
    renderAt('/studies')
    await screen.findByRole('button', { name: 'New subject' })
    click(page(), 'New subject')
    const dialog = await findDialog('New subject')
    choose(dialog, 'Category', 'Math')
    fill(dialog, 'Name', 'calculus')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('a subject with this name already exists in the category')).toBeTruthy()
    expect(errorFor(dialog, 'Name')).toBe('a subject with this name already exists in the category')
  })
})

describe('Edit subject (S09a-9)', () => {
  async function openEdit(service = new InMemoryStudiesAdapter(librarySeed())) {
    renderAt(SUBJECT_URL, service)
    await screen.findByRole('heading', { level: 1, name: 'AWS Certified Cloud Practitioner' })
    click(page(), 'Edit subject')
    return { service, dialog: await findDialog('Edit subject') }
  }

  it('is prefilled with the current values', async () => {
    const { dialog } = await openEdit()
    expect(fieldValue(dialog, 'Name')).toBe('AWS Certified Cloud Practitioner')
    expect(fieldValue(dialog, 'Description')).toBe('Foundational AWS certification.')
    expect((within(dialog).getByLabelText('Category') as HTMLSelectElement).selectedOptions[0].textContent).toBe('TI / Cloud / AWS')
  })

  it('sends only what changed and updates the header', async () => {
    const service = new InMemoryStudiesAdapter(librarySeed())
    const update = vi.spyOn(service, 'updateSubject')
    const { dialog } = await openEdit(service)
    fill(dialog, 'Name', 'AWS CCP')
    fill(dialog, 'Description', 'Updated.')
    click(dialog, 'Save')
    expect(await screen.findByRole('heading', { level: 1, name: 'AWS CCP' })).toBeTruthy()
    expect(screen.getByText('Updated.')).toBeTruthy()
    expect(update).toHaveBeenCalledWith(IDS.ccp, { name: 'AWS CCP', description: 'Updated.' })
  })

  it('a blank description is sent as null', async () => {
    const service = new InMemoryStudiesAdapter(librarySeed())
    const update = vi.spyOn(service, 'updateSubject')
    const { dialog } = await openEdit(service)
    fill(dialog, 'Description', '   ')
    click(dialog, 'Save')
    await waitFor(() => expect(update).toHaveBeenCalledWith(IDS.ccp, { description: null }))
    await waitFor(() => expect(screen.queryByText('Foundational AWS certification.')).toBeNull())
  })

  it('an unchanged form sends nothing (the API would answer 422 to an empty patch)', async () => {
    const service = new InMemoryStudiesAdapter(librarySeed())
    const update = vi.spyOn(service, 'updateSubject')
    const { dialog } = await openEdit(service)
    fill(dialog, 'Name', '  AWS Certified Cloud Practitioner ')
    click(dialog, 'Save')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(update).not.toHaveBeenCalled()
  })

  it('still saves a rename when the category list cannot load', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const update = vi.spyOn(base, 'updateSubject')
    const service = Object.assign(base, { listCategories: () => Promise.reject(new Error('categories down')) })
    const { dialog } = await openEdit(service)
    expect(await within(dialog).findByText('categories down')).toBeTruthy()
    fill(dialog, 'Name', 'AWS CCP')
    click(dialog, 'Save')
    await waitFor(() => expect(update).toHaveBeenCalledWith(IDS.ccp, { name: 'AWS CCP' }))
  })

  it('editing a subject deleted meanwhile says so and blocks Save', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      updateSubject: () => Promise.reject(new StudiesNotFoundError()),
    })
    const { dialog } = await openEdit(service)
    fill(dialog, 'Name', 'AWS CCP')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('changing the category moves the subject and the path follows', async () => {
    const service = new InMemoryStudiesAdapter(librarySeed())
    const update = vi.spyOn(service, 'updateSubject')
    const { dialog } = await openEdit(service)
    choose(dialog, 'Category', 'Math')
    click(dialog, 'Save')
    await waitFor(() => expect(update).toHaveBeenCalledWith(IDS.ccp, { categoryId: IDS.math }))
    expect(await screen.findByText('Math')).toBeTruthy()
  })
})

describe('Delete subject (AC-F11, S09a-7)', () => {
  it('in use: explains with the subject text and disables Delete', async () => {
    renderAt(SUBJECT_URL)
    await screen.findByRole('heading', { level: 1, name: 'AWS Certified Cloud Practitioner' })
    click(page(), 'Delete subject')
    const dialog = await findDialog('Delete subject “AWS Certified Cloud Practitioner”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('Move or delete its notes first.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('already deleted: says so, blocks Delete, and closing returns to the library', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      deleteSubject: () => Promise.reject(new StudiesNotFoundError()),
    })
    renderAt(`/studies/subjects/${IDS.emptySubject}`, service)
    await screen.findByRole('heading', { level: 1, name: 'Calculus' })
    click(page(), 'Delete subject')
    const dialog = await findDialog('Delete subject “Calculus”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
    click(dialog, 'Cancel')
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
  })

  it('deletes an empty subject and returns to the library with a toast', async () => {
    renderAt(`/studies/subjects/${IDS.emptySubject}`)
    await screen.findByRole('heading', { level: 1, name: 'Calculus' })
    click(page(), 'Delete subject')
    const dialog = await findDialog('Delete subject “Calculus”?')
    click(dialog, 'Delete')
    expect(await screen.findByText('Subject deleted')).toBeTruthy()
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
  })
})
