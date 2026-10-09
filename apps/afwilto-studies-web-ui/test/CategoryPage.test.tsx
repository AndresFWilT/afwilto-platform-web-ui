import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter, type StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError } from '../src/application/errors'
import { currentLocation, renderAt } from './support/renderStudies'
import { click, fill, findDialog, selectedText } from './support/forms'
import { IDS, librarySeed } from './fixtures'

const page = () => document.body
const EMPTY_CHILD = '00000000-0000-7000-8000-0000000000e2'
const EMPTY_ROOT = '00000000-0000-7000-8000-0000000000e3'
const HEX = 'abcdef02-0000-7000-8000-00000000abcd' // letters, so its case can differ in the URL

function seed(): StudiesSeed {
  const s = librarySeed()
  s.categories.push(
    { id: EMPTY_CHILD, parentId: IDS.ti, name: 'Empty child', color: '#A3E635' },
    { id: EMPTY_ROOT, parentId: null, name: 'Empty root', color: '#A3E635' },
    { id: HEX, parentId: IDS.ti, name: 'Hex', color: '#A3E635' }
  )
  return s
}

let confirmSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled()
  confirmSpy.mockRestore()
})

async function openView(id: string, service = new InMemoryStudiesAdapter(seed())) {
  renderAt(`/studies/categories/${id}`, service)
  return service
}

const breadcrumb = () => screen.getByRole('navigation', { name: 'Breadcrumb' })

describe('Category view (S09a2-5)', () => {
  it('shows a breadcrumb whose ancestors are links and whose current level is not', async () => {
    await openView(IDS.cloud)
    expect(await screen.findByRole('heading', { level: 1, name: 'Cloud' })).toBeTruthy()
    const links = within(breadcrumb()).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toEqual([
      ['Studies', '/studies'],
      ['TI', `/studies/categories/${IDS.ti}`],
    ])
    const current = within(breadcrumb()).getByText('Cloud')
    expect(current.getAttribute('aria-current')).toBe('page')
    expect(current.closest('a')).toBeNull()
  })

  it('lists direct subcategories and subjects with their counts', async () => {
    await openView(IDS.cloud)
    const subcategories = await screen.findByRole('list', { name: 'Subcategories' })
    const aws = within(subcategories).getByRole('link', { name: /AWS/ })
    expect(aws.getAttribute('href')).toBe(`/studies/categories/${IDS.aws}`)
    expect(within(aws).getByText('1 subject')).toBeTruthy() // exact: not "1 subjects"
    const subjects = screen.getByRole('list', { name: 'Subjects' })
    const azure = within(subjects).getByRole('link', { name: /Azure/ })
    expect(azure.getAttribute('href')).toBe(`/studies/subjects/${IDS.azure}`)
    expect(within(azure).getByText('1 note')).toBeTruthy()
  })

  it('a category with only subcategories shows them, and no empty state', async () => {
    await openView(IDS.ti)
    expect(await screen.findByRole('list', { name: 'Subcategories' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Subjects' })).toBeNull()
    expect(screen.queryByText('No subcategories or subjects yet')).toBeNull()
  })

  it('a category with only subjects shows them, and no empty state', async () => {
    await openView(IDS.aws)
    expect(await screen.findByRole('list', { name: 'Subjects' })).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Subcategories' })).toBeNull()
    expect(screen.queryByText('No subcategories or subjects yet')).toBeNull()
  })

  it('resolves the id case-insensitively, and "New subject" preselects it (F3, M3)', async () => {
    await openView(HEX.toUpperCase())
    expect(await screen.findByRole('heading', { level: 1, name: 'Hex' })).toBeTruthy()
    click(page(), 'New subject')
    expect(selectedText(await findDialog('New subject'), 'Category')).toBe('TI / Hex')
  })

  it('climbs the breadcrumb level by level', async () => {
    await openView(IDS.aws)
    await screen.findByRole('heading', { level: 1, name: 'AWS' })
    fireEvent.click(within(breadcrumb()).getByRole('link', { name: 'Cloud' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Cloud' })).toBeTruthy()
    expect(currentLocation()).toBe(`/studies/categories/${IDS.cloud}`)
    fireEvent.click(within(breadcrumb()).getByRole('link', { name: 'Studies' }))
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
  })
})

describe('Category view actions (S09a2-6)', () => {
  it('"New subject" preselects this category and lands on the new subject', async () => {
    await openView(IDS.cloud)
    await screen.findByRole('heading', { level: 1, name: 'Cloud' })
    click(page(), 'New subject')
    const dialog = await findDialog('New subject')
    expect(selectedText(dialog, 'Category')).toBe('TI / Cloud')
    fill(dialog, 'Name', 'GCP')
    click(dialog, 'Save')
    expect(await screen.findByRole('heading', { level: 1, name: 'GCP' })).toBeTruthy()
  })

  it('Edit renames the heading', async () => {
    await openView(IDS.cloud)
    await screen.findByRole('heading', { level: 1, name: 'Cloud' })
    click(page(), 'Edit Cloud')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Cloud Computing')
    click(dialog, 'Save')
    expect(await screen.findByRole('heading', { level: 1, name: 'Cloud Computing' })).toBeTruthy()
  })

  it('Delete of an in-use category explains', async () => {
    await openView(IDS.cloud)
    await screen.findByRole('heading', { level: 1, name: 'Cloud' })
    click(page(), 'Delete Cloud')
    const dialog = await findDialog('Delete category “Cloud”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('Move or delete its subcategories and subjects first.')).toBeTruthy()
  })

  it('deleting an empty child goes to the parent view', async () => {
    await openView(EMPTY_CHILD)
    await screen.findByRole('heading', { level: 1, name: 'Empty child' })
    click(page(), 'Delete Empty child')
    click(await findDialog('Delete category “Empty child”?'), 'Delete')
    expect(await screen.findByText('Category deleted')).toBeTruthy()
    await waitFor(() => expect(currentLocation()).toBe(`/studies/categories/${IDS.ti}`))
    await screen.findByRole('heading', { level: 1, name: 'TI' })
    await waitFor(() => {
      const list = screen.getByRole('list', { name: 'Subcategories' })
      expect(within(list).queryByRole('link', { name: /Empty child/ })).toBeNull()
    })
  })

  it('deleting an empty root goes to the library', async () => {
    await openView(EMPTY_ROOT)
    await screen.findByRole('heading', { level: 1, name: 'Empty root' })
    click(page(), 'Delete Empty root')
    click(await findDialog('Delete category “Empty root”?'), 'Delete')
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
  })

  it('"Add child" is offered below depth 5 and preselects this category', async () => {
    await openView(IDS.aws)
    await screen.findByRole('heading', { level: 1, name: 'AWS' })
    click(page(), 'Add child to AWS')
    expect(selectedText(await findDialog('New category'), 'Parent')).toBe('TI / Cloud / AWS')
  })
})

describe('Category view — a category deleted elsewhere (F2)', () => {
  it('Delete keeps "It was already deleted." while the page refetches', async () => {
    const base = new InMemoryStudiesAdapter(seed())
    const service = Object.assign(base, {
      deleteCategory: async (id: string) => {
        await InMemoryStudiesAdapter.prototype.deleteCategory.call(base, id) // really gone now…
        throw new StudiesNotFoundError() // …and the API says so
      },
    })
    await openView(EMPTY_ROOT, service)
    await screen.findByRole('heading', { level: 1, name: 'Empty root' })
    click(page(), 'Delete Empty root')
    const dialog = await findDialog('Delete category “Empty root”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    await screen.findByText('Category not found')
    const still = screen.getByRole('dialog', { name: 'Delete category “Empty root”?' })
    expect(within(still).getByText('It was already deleted.')).toBeTruthy()
    expect((within(still).getByRole('button', { name: 'Delete' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('Edit keeps "It was already deleted." while the page refetches', async () => {
    const base = new InMemoryStudiesAdapter(seed())
    const service = Object.assign(base, {
      updateCategory: async () => {
        await InMemoryStudiesAdapter.prototype.deleteCategory.call(base, EMPTY_ROOT)
        throw new StudiesNotFoundError()
      },
    })
    await openView(EMPTY_ROOT, service)
    await screen.findByRole('heading', { level: 1, name: 'Empty root' })
    click(page(), 'Edit Empty root')
    const dialog = await findDialog('Edit category')
    fill(dialog, 'Name', 'Renamed')
    click(dialog, 'Save')
    await screen.findByText('Category not found')
    const still = screen.getByRole('dialog', { name: 'Edit category' })
    expect(within(still).getByText('It was already deleted.')).toBeTruthy()
  })
})

describe('Category view states (S09a2-7)', () => {
  it('an unknown id shows "Category not found"', async () => {
    await openView(IDS.missing)
    expect(await screen.findByText('Category not found')).toBeTruthy()
  })

  it('a category without children or subjects says so', async () => {
    await openView(EMPTY_ROOT)
    expect(await screen.findByText('No subcategories or subjects yet')).toBeTruthy()
  })
})
