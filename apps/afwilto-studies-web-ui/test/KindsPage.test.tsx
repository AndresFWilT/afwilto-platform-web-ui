import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError } from '../src/application/errors'
import { renderAt } from './support/renderStudies'
import { click, errorFor, fieldValue, fill, findDialog } from './support/forms'
import { librarySeed } from './fixtures'

let confirmSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled()
  confirmSpy.mockRestore()
})

async function openPage(service = new InMemoryStudiesAdapter(librarySeed())) {
  renderAt('/studies/kinds', service)
  await screen.findByRole('heading', { level: 1, name: 'Note kinds' })
  await screen.findByText('Summary')
  return service
}

function row(name: string): HTMLElement {
  return screen.getByText(name, { selector: '[data-kind-name]' }).closest('li')!
}

const page = () => document.body

describe('KindsPage (AC-F12, S09a-8)', () => {
  it('lists alive kinds alphabetically with their note counts', async () => {
    await openPage()
    const names = [...document.querySelectorAll('[data-kind-name]')].map((n) => n.textContent)
    expect(names).toEqual(['Cheat sheet', 'Summary'])
    expect(within(row('Cheat sheet')).getByText('1 note')).toBeTruthy()
    expect(within(row('Summary')).getByText('3 notes')).toBeTruthy()
  })

  it('creates a kind and clears the field', async () => {
    await openPage()
    fill(page(), 'New kind name', ' Lab report ')
    click(page(), 'Add kind')
    expect(await screen.findByText('Lab report', { selector: '[data-kind-name]' })).toBeTruthy()
    expect(fieldValue(page(), 'New kind name')).toBe('')
    expect(screen.getByText('Kind created')).toBeTruthy()
  })

  it('validates on the client and shows a server duplicate, keeping the input', async () => {
    const service = await openPage()
    const create = vi.spyOn(service, 'createKind')
    click(page(), 'Add kind')
    expect(await screen.findByText('Name is required')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
    fill(page(), 'New kind name', 'summary')
    click(page(), 'Add kind')
    expect(await screen.findByText('a note kind with this name already exists')).toBeTruthy()
    expect(errorFor(page(), 'New kind name')).toBe('a note kind with this name already exists')
    expect(fieldValue(page(), 'New kind name')).toBe('summary')
  })

  it('renames through a prefilled dialog', async () => {
    await openPage()
    click(page(), 'Rename Summary')
    const dialog = await findDialog('Rename kind')
    expect(fieldValue(dialog, 'Name')).toBe('Summary')
    fill(dialog, 'Name', 'Overview')
    click(dialog, 'Save')
    expect(await screen.findByText('Overview', { selector: '[data-kind-name]' })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('a same-name rename sends nothing; a duplicate shows in the dialog', async () => {
    const service = await openPage()
    const rename = vi.spyOn(service, 'renameKind')
    click(page(), 'Rename Summary')
    let dialog = await findDialog('Rename kind')
    fill(dialog, 'Name', '  Summary ')
    click(dialog, 'Save')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(rename).not.toHaveBeenCalled()

    click(page(), 'Rename Summary')
    dialog = await findDialog('Rename kind')
    fill(dialog, 'Name', 'cheat SHEET')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('a note kind with this name already exists')).toBeTruthy()
    expect(errorFor(dialog, 'Name')).toBe('a note kind with this name already exists')
  })

  it('renaming a kind deleted meanwhile says so and refetches the list', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const list = vi.spyOn(base, 'listKinds')
    const service = Object.assign(base, { renameKind: () => Promise.reject(new StudiesNotFoundError()) })
    await openPage(service)
    const before = list.mock.calls.length
    click(page(), 'Rename Summary')
    const dialog = await findDialog('Rename kind')
    fill(dialog, 'Name', 'Overview')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before))
  })
})

describe('KindsPage — delete (AC-F11, S09a-7)', () => {
  it('in use: explains with the kind text and disables Delete', async () => {
    await openPage()
    click(page(), 'Delete Summary')
    const dialog = await findDialog('Delete kind “Summary”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('Change or delete the notes using this kind first.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('deletes an unused kind', async () => {
    const seed = librarySeed()
    seed.kinds.push({ id: '00000000-0000-7000-8000-0000000000d1', name: 'Unused' })
    await openPage(new InMemoryStudiesAdapter(seed))
    click(page(), 'Delete Unused')
    const dialog = await findDialog('Delete kind “Unused”?')
    click(dialog, 'Delete')
    expect(await screen.findByText('Kind deleted')).toBeTruthy()
    await waitFor(() => expect(screen.queryByText('Unused', { selector: '[data-kind-name]' })).toBeNull())
  })

  it('already deleted: says so and refetches the list', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const list = vi.spyOn(base, 'listKinds')
    const service = Object.assign(base, { deleteKind: () => Promise.reject(new StudiesNotFoundError()) })
    await openPage(service)
    const before = list.mock.calls.length
    click(page(), 'Delete Summary')
    const dialog = await findDialog('Delete kind “Summary”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before))
  })
})
