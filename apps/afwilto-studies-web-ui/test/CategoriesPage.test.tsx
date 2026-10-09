import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError, StudiesValidationError } from '../src/application/errors'
import { renderAt } from './support/renderStudies'
import { choose, click, errorFor, fieldValue, fill, findDialog, optionTexts, selectedText } from './support/forms'
import { IDS, librarySeed } from './fixtures'

const EMPTY = '00000000-0000-7000-8000-0000000000e1'

function seedWithEmpty(): StudiesSeed {
  const seed = librarySeed()
  seed.categories.push({ id: EMPTY, parentId: null, name: 'Empty', color: '#A3E635' })
  return seed
}

let confirmSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled() // AC-F11: never a native dialog
  confirmSpy.mockRestore()
})

async function openPage(service = new InMemoryStudiesAdapter(librarySeed())) {
  renderAt('/studies/categories', service)
  await screen.findByRole('heading', { level: 1, name: 'Categories' })
  await screen.findByText('AWS')
  return service
}

describe('CategoriesPage — tree and actions (AC-F13)', () => {
  it('shows every category with add-child, edit and delete actions', async () => {
    await openPage()
    for (const name of ['TI', 'Cloud', 'AWS', 'Math']) {
      expect(screen.getByRole('button', { name: `Add child to ${name}` })).toBeTruthy()
      expect(screen.getByRole('button', { name: `Edit ${name}` })).toBeTruthy()
      expect(screen.getByRole('button', { name: `Delete ${name}` })).toBeTruthy()
    }
  })

  it('hides "Add child" on a depth-5 category (the server would refuse a sixth level)', async () => {
    const seed = librarySeed()
    seed.categories.push(
      { id: 'd4', parentId: IDS.aws, name: 'D4', color: '#22D3EE' },
      { id: 'd5', parentId: 'd4', name: 'D5', color: '#22D3EE' }
    )
    await openPage(new InMemoryStudiesAdapter(seed))
    expect(screen.getByRole('button', { name: 'Add child to D4' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add child to D5' })).toBeNull()
  })
})

describe('CategoriesPage — parent picker (AC-F13, S09a-4)', () => {
  it('on create offers the root plus every path, in path order', async () => {
    await openPage()
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    expect(optionTexts(dialog, 'Parent')).toEqual(['— Root —', 'Math', 'TI', 'TI / Cloud', 'TI / Cloud / AWS'])
    expect(selectedText(dialog, 'Parent')).toBe('— Root —')
  })

  it('"Add child" preselects that category as the parent', async () => {
    await openPage()
    click(document.body, 'Add child to AWS')
    const dialog = await findDialog('New category')
    expect(selectedText(dialog, 'Parent')).toBe('TI / Cloud / AWS')
  })

  it('on edit excludes the category and its descendants, preselecting the current parent', async () => {
    await openPage()
    click(document.body, 'Edit Cloud')
    const dialog = await findDialog('Edit category')
    expect(optionTexts(dialog, 'Parent')).toEqual(['— Root —', 'Math', 'TI'])
    expect(selectedText(dialog, 'Parent')).toBe('TI')
    expect(fieldValue(dialog, 'Name')).toBe('Cloud')
    expect(fieldValue(dialog, 'Color')).toBe('#22D3EE')
  })

  it('excludes parents too deep for the moved subtree, but keeps the current parent', async () => {
    const chain: StudiesSeed = {
      categories: [
        { id: 'a', parentId: null, name: 'A', color: '#111111' },
        { id: 'b', parentId: 'a', name: 'B', color: '#111111' },
        { id: 'c', parentId: 'b', name: 'C', color: '#111111' },
        { id: 'd', parentId: 'c', name: 'D', color: '#111111' },
        { id: 'e', parentId: 'd', name: 'E', color: '#111111' },
        { id: 'x', parentId: null, name: 'X', color: '#111111' },
        { id: 'y', parentId: 'x', name: 'Y', color: '#111111' },
        { id: 'z', parentId: 'y', name: 'Z', color: '#111111' },
      ],
      kinds: [],
      subjects: [],
      notes: [],
    }
    renderAt('/studies/categories', new InMemoryStudiesAdapter(chain))
    await screen.findByRole('button', { name: 'Edit C' })
    click(document.body, 'Edit C')
    const dialog = await findDialog('Edit category')
    // C's subtree (C > D > E) has height 3, so a parent must sit at depth ≤ 2.
    expect(optionTexts(dialog, 'Parent')).toEqual(['— Root —', 'A', 'A / B', 'X', 'X / Y'])
    expect(selectedText(dialog, 'Parent')).toBe('A / B')
    click(dialog, 'Cancel')

    // A new category is a leaf (height 1): any parent up to depth 4, never the depth-5 E.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    click(document.body, 'New root category')
    const create = await findDialog('New category')
    expect(optionTexts(create, 'Parent')).toEqual(['— Root —', 'A', 'A / B', 'A / B / C', 'A / B / C / D', 'X', 'X / Y', 'X / Y / Z'])
  })
})

describe('CategoriesPage — create (S09a-5)', () => {
  it('creates with a trimmed name and an uppercase color, refetches and toasts', async () => {
    const service = await openPage()
    const create = vi.spyOn(service, 'createCategory')
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fill(dialog, 'Name', '  Physics ')
    fill(dialog, 'Color', '#ff9900')
    click(dialog, 'Save')
    expect(await screen.findByText('Category created')).toBeTruthy()
    expect(create).toHaveBeenCalledWith({ name: 'Physics', color: '#FF9900', parentId: null })
    expect(await screen.findByText('Physics')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows client-side errors and sends nothing', async () => {
    const service = await openPage()
    const create = vi.spyOn(service, 'createCategory')
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fill(dialog, 'Color', 'red')
    click(dialog, 'Save')
    expect(within(dialog).getByText('Name is required')).toBeTruthy()
    expect(within(dialog).getByText('Use a hex color like #22D3EE')).toBeTruthy()
    expect(create).not.toHaveBeenCalled()
  })

  it('shows a server duplicate under Name and keeps the input', async () => {
    await openPage()
    click(document.body, 'Add child to TI')
    const dialog = await findDialog('New category')
    fill(dialog, 'Name', 'cloud')
    fill(dialog, 'Color', '#22D3EE')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('a sibling category with this name already exists')).toBeTruthy()
    expect(errorFor(dialog, 'Name')).toBe('a sibling category with this name already exists')
    expect(fieldValue(dialog, 'Name')).toBe('cloud')
  })
})

describe('CategoriesPage — color picker (S09a-5, amended)', () => {
  const picker = (dialog: HTMLElement) => within(dialog).getByLabelText('Pick color') as HTMLInputElement

  it('offers a native color picker, and a new category starts at #22D3EE', async () => {
    await openPage()
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    expect(picker(dialog).type).toBe('color')
    expect(picker(dialog).value).toBe('#22d3ee')
    expect(fieldValue(dialog, 'Color')).toBe('#22D3EE')
  })

  it('a picked color fills the hex field in uppercase and is what gets saved', async () => {
    const service = await openPage()
    const create = vi.spyOn(service, 'createCategory')
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fireEvent.change(picker(dialog), { target: { value: '#ff9900' } })
    expect(fieldValue(dialog, 'Color')).toBe('#FF9900')
    fill(dialog, 'Name', 'Physics')
    click(dialog, 'Save')
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Physics', color: '#FF9900', parentId: null }))
  })

  it('a valid typed hex moves the picker; an invalid one leaves it at black', async () => {
    await openPage()
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fill(dialog, 'Color', '#A3E635')
    expect(picker(dialog).value).toBe('#a3e635')
    fill(dialog, 'Color', '#A3E6')
    expect(picker(dialog).value).toBe('#000000')
  })

  it('a new category saves with the default color without touching it', async () => {
    const service = await openPage()
    const create = vi.spyOn(service, 'createCategory')
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fill(dialog, 'Name', 'Physics')
    click(dialog, 'Save')
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Physics', color: '#22D3EE', parentId: null }))
  })

  it('editing starts the picker at the stored color', async () => {
    await openPage()
    click(document.body, 'Edit AWS')
    const dialog = await findDialog('Edit category')
    expect(picker(dialog).value).toBe('#ff9900')
  })
})

describe('CategoriesPage — edit (S09a-6)', () => {
  it('a rename sends only the name', async () => {
    const service = await openPage()
    const update = vi.spyOn(service, 'updateCategory')
    click(document.body, 'Edit Cloud')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Cloud Computing')
    click(dialog, 'Save')
    expect(await screen.findByText('Category updated')).toBeTruthy()
    expect(update).toHaveBeenCalledWith(IDS.cloud, { name: 'Cloud Computing' })
    expect(await screen.findByText('Cloud Computing')).toBeTruthy()
  })

  it('moving to the root sends parentId null', async () => {
    const service = await openPage()
    const update = vi.spyOn(service, 'updateCategory')
    click(document.body, 'Edit AWS')
    const dialog = await findDialog('Edit category')
    choose(dialog, 'Parent', '— Root —')
    click(dialog, 'Save')
    await waitFor(() => expect(update).toHaveBeenCalledWith(IDS.aws, { parentId: null }))
  })

  it('an unchanged form sends nothing and closes', async () => {
    const service = await openPage()
    const update = vi.spyOn(service, 'updateCategory')
    click(document.body, 'Edit Math')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', ' Math ')
    click(dialog, 'Save')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(update).not.toHaveBeenCalled()
  })

  it('a server cycle or max_depth shows under Parent', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      updateCategory: () =>
        Promise.reject(
          new StudiesValidationError([{ field: 'parentId', rule: 'cycle', message: 'a category cannot be placed under itself or one of its descendants' }])
        ),
    })
    await openPage(service)
    click(document.body, 'Edit Math')
    const dialog = await findDialog('Edit category')
    choose(dialog, 'Parent', 'TI')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('a category cannot be placed under itself or one of its descendants')).toBeTruthy()
    expect(errorFor(dialog, 'Parent')).toBe('a category cannot be placed under itself or one of its descendants')
  })

  it('editing a category deleted meanwhile says so, blocks Save and refetches the tree', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const list = vi.spyOn(base, 'listCategories')
    const service = Object.assign(base, { updateCategory: () => Promise.reject(new StudiesNotFoundError()) })
    await openPage(service)
    const before = list.mock.calls.length
    click(document.body, 'Edit Math')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Mathematics')
    click(dialog, 'Save')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true)
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before))
  })

  it('a network failure toasts its message and keeps the dialog open with the input', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      createCategory: () => Promise.reject(new Error('Failed to fetch')),
    })
    await openPage(service)
    click(document.body, 'New root category')
    const dialog = await findDialog('New category')
    fill(dialog, 'Name', 'Physics')
    fill(dialog, 'Color', '#22D3EE')
    click(dialog, 'Save')
    expect(await screen.findByText('Failed to fetch')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'New category' })).toBeTruthy()
    expect(fieldValue(dialog, 'Name')).toBe('Physics')
  })
})

describe('CategoriesPage — delete (AC-F11, S09a-7)', () => {
  it('deletes an empty category, which leaves the tree', async () => {
    await openPage(new InMemoryStudiesAdapter(seedWithEmpty()))
    click(document.body, 'Delete Empty')
    const dialog = await findDialog('Delete category “Empty”?')
    expect(within(dialog).getByText('This cannot be undone from the app.')).toBeTruthy()
    click(dialog, 'Delete')
    expect(await screen.findByText('Category deleted')).toBeTruthy()
    await waitFor(() => expect(screen.queryByText('Empty')).toBeNull())
  })

  it('in use: explains, disables Delete and stays open', async () => {
    await openPage()
    click(document.body, 'Delete TI')
    const dialog = await findDialog('Delete category “TI”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('Move or delete its subcategories and subjects first.')).toBeTruthy()
    expect((within(dialog).getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('any other failure shows its message in the dialog', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      deleteCategory: () => Promise.reject(new Error('internal server error')),
    })
    await openPage(service)
    click(document.body, 'Delete Math')
    const dialog = await findDialog('Delete category “Math”?')
    click(dialog, 'Delete')
    expect((await within(dialog).findByRole('alert')).textContent).toContain('internal server error')
  })

  it('already deleted: says so and refetches the tree', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const list = vi.spyOn(base, 'listCategories')
    const service = Object.assign(base, { deleteCategory: () => Promise.reject(new StudiesNotFoundError()) })
    await openPage(service)
    const before = list.mock.calls.length
    click(document.body, 'Delete Math')
    const dialog = await findDialog('Delete category “Math”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    await waitFor(() => expect(list.mock.calls.length).toBeGreaterThan(before))
  })
})
