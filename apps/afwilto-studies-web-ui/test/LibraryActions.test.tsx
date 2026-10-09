import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { renderAt } from './support/renderStudies'
import { click, fill, findDialog, selectedText } from './support/forms'
import { IDS, librarySeed } from './fixtures'

const page = () => document.body
let confirmSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled()
  confirmSpy.mockRestore()
})

async function openLibrary(service = new InMemoryStudiesAdapter(librarySeed())) {
  renderAt('/studies', service)
  await screen.findByRole('button', { name: 'Edit AWS' })
  return service
}

describe('Library — category actions (S09a2-1, S09a2-2)', () => {
  it('"New category" creates a root without leaving the library', async () => {
    await openLibrary()
    click(page(), 'New category')
    const dialog = await findDialog('New category')
    expect(selectedText(dialog, 'Parent')).toBe('— Root —')
    fill(dialog, 'Name', 'Physics')
    click(dialog, 'Save')
    expect(await screen.findByText('Category created')).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Physics' })).toBeTruthy()
  })

  it('"Add child" preselects that category as parent', async () => {
    await openLibrary()
    click(page(), 'Add child to AWS')
    const dialog = await findDialog('New category')
    expect(selectedText(dialog, 'Parent')).toBe('TI / Cloud / AWS')
  })

  it('"Edit" renames in place', async () => {
    await openLibrary()
    click(page(), 'Edit Cloud')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Cloud Computing')
    click(dialog, 'Save')
    expect(await screen.findByRole('link', { name: 'Cloud Computing' })).toBeTruthy()
    expect(screen.getByText('Category updated')).toBeTruthy()
  })

  it('"Delete" explains an in-use category and removes an empty one', async () => {
    const seed = librarySeed()
    seed.categories.push({ id: '00000000-0000-7000-8000-0000000000e1', parentId: null, name: 'Empty', color: '#A3E635' })
    await openLibrary(new InMemoryStudiesAdapter(seed))

    click(page(), 'Delete TI')
    let dialog = await findDialog('Delete category “TI”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('Move or delete its subcategories and subjects first.')).toBeTruthy()
    click(dialog, 'Cancel')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    click(page(), 'Delete Empty')
    dialog = await findDialog('Delete category “Empty”?')
    click(dialog, 'Delete')
    expect(await screen.findByText('Category deleted')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Empty' })).toBeNull())
  })

  it('hides "Add child" on a depth-5 category', async () => {
    const seed: StudiesSeed = librarySeed()
    seed.categories.push(
      { id: '00000000-0000-7000-8000-0000000000d4', parentId: IDS.aws, name: 'D4', color: '#22D3EE' },
      { id: '00000000-0000-7000-8000-0000000000d5', parentId: '00000000-0000-7000-8000-0000000000d4', name: 'D5', color: '#22D3EE' }
    )
    await openLibrary(new InMemoryStudiesAdapter(seed))
    expect(screen.getByRole('button', { name: 'Add child to D4' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add child to D5' })).toBeNull()
  })
})

describe('Library — refetch keeps the tree (F5)', () => {
  it('a collapsed node stays collapsed and "New subject" stays available after an edit', async () => {
    const service = await openLibrary()
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const list = service.listCategories.bind(service)
    Object.assign(service, {
      listCategories: async () => {
        await gate
        return list()
      },
    })
    click(page(), 'Collapse Math')
    click(page(), 'Edit AWS')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Amazon')
    click(dialog, 'Save')
    await screen.findByText('Category updated')
    // While the refetch is pending the old tree stays on screen.
    expect(screen.getByRole('button', { name: 'Expand Math' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New subject' })).toBeTruthy()
    release()
    expect(await screen.findByRole('link', { name: 'Amazon' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Expand Math' })).toBeTruthy()
  })
})

describe('Library — empty state and category links (S09a2-3, S09a2-4)', () => {
  it('the empty state button opens the New category dialog', async () => {
    renderAt('/studies', new InMemoryStudiesAdapter({ categories: [], kinds: [], subjects: [], notes: [] }))
    await screen.findByRole('button', { name: 'Create a category' })
    click(page(), 'Create a category')
    expect(await findDialog('New category')).toBeTruthy()
  })

  it('each category name links to its category view', async () => {
    await openLibrary()
    expect(screen.getByRole('link', { name: 'Cloud' }).getAttribute('href')).toBe(`/studies/categories/${IDS.cloud}`)
    expect(screen.getByRole('link', { name: 'TI' }).getAttribute('href')).toBe(`/studies/categories/${IDS.ti}`)
  })
})
