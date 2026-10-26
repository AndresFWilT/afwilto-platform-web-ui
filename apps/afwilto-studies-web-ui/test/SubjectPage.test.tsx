import { describe, it, expect } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { NoteSort } from '../src/application/ports'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { currentLocation, failingService, noteTitles, renderAt } from './support/renderStudies'
import { AC_B16_ORDERS, IDS, librarySeed } from './fixtures'

const SUBJECT_URL = `/studies/subjects/${IDS.ccp}`

function sortSelect(): HTMLSelectElement {
  return screen.getByRole('combobox', { name: 'Sort notes' }) as HTMLSelectElement
}

function chooseSort(label: string) {
  const option = within(sortSelect()).getByRole('option', { name: label }) as HTMLOptionElement
  fireEvent.change(sortSelect(), { target: { value: option.value } })
}

describe('SubjectPage (AC-F4)', () => {
  it('shows the category breadcrumb, name and description (S07-6, S09a2-8)', async () => {
    renderAt(SUBJECT_URL)
    expect(await screen.findByRole('heading', { level: 1, name: 'AWS Certified Cloud Practitioner' })).toBeTruthy()
    const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Studies', '/studies'],
      ['TI', `/studies/categories/${IDS.ti}`],
      ['Cloud', `/studies/categories/${IDS.cloud}`],
      ['AWS', `/studies/categories/${IDS.aws}`],
    ])
    expect(screen.getByText('Foundational AWS certification.')).toBeTruthy()
  })

  it('links to the subject exams: a single "Practice Exams" link (S08-9)', async () => {
    renderAt(SUBJECT_URL)
    const link = await screen.findByRole('link', { name: 'Practice Exams' })
    expect(link.getAttribute('href')).toBe(`/studies/subjects/${IDS.ccp}/exams`)
    expect(screen.getAllByRole('link', { name: 'Practice Exams' })).toHaveLength(1)
  })

  it('a breadcrumb segment navigates to that category view (S09a2-8)', async () => {
    renderAt(SUBJECT_URL)
    const crumbs = await screen.findByRole('navigation', { name: 'Breadcrumb' })
    fireEvent.click(within(crumbs).getByRole('link', { name: 'Cloud' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Cloud' })).toBeTruthy()
    expect(currentLocation()).toBe(`/studies/categories/${IDS.cloud}`)
  })

  it('renders one row per note with title link, kind badge, tags and updated date (S07-6)', async () => {
    renderAt(SUBJECT_URL)
    await waitFor(() => expect(noteTitles()).toEqual(['Compute', 'Networking', 'Storage']))
    const compute = screen.getByRole('link', { name: 'Compute' })
    expect(compute.getAttribute('href')).toBe(`/studies/notes/${IDS.compute}`)

    const row = compute.closest('li')!
    expect(within(row).getByText('Summary')).toBeTruthy()
    expect(within(row).getByRole('link', { name: 'ec2' })).toBeTruthy()
    expect(within(row).getByRole('link', { name: 'iam' })).toBeTruthy()
    expect(within(row).getByText('Jan 3, 2026')).toBeTruthy()
  })

  it('a tag chip navigates to /studies/tags/:tag (S07-6)', async () => {
    renderAt(SUBJECT_URL)
    const row = (await screen.findByRole('link', { name: 'Compute' })).closest('li')!
    const chip = within(row).getByRole('link', { name: 'iam' })
    expect(chip.getAttribute('href')).toBe('/studies/tags/iam')
    fireEvent.click(chip)
    await waitFor(() => expect(currentLocation()).toBe('/studies/tags/iam'))
  })

  it('offers the five sort options, A–Z selected by default', async () => {
    renderAt(SUBJECT_URL)
    await screen.findByRole('link', { name: 'Compute' })
    const labels = within(sortSelect()).getAllByRole('option').map((o) => o.textContent)
    expect(labels).toEqual(AC_B16_ORDERS.map((o) => o.label))
    expect(sortSelect().selectedOptions[0].textContent).toBe('A–Z')
  })

  it.each(AC_B16_ORDERS)('"$label" orders $titles and writes the URL (S07-7)', async ({ label, sort, order, titles }) => {
    renderAt(SUBJECT_URL)
    await screen.findByRole('link', { name: 'Compute' })
    if (label === 'A–Z') chooseSort('Z–A') // leave the default first, so choosing A–Z is a real change
    chooseSort(label)
    await waitFor(() => expect(noteTitles()).toEqual(titles))
    const expected = label === 'A–Z' ? SUBJECT_URL : `${SUBJECT_URL}?sort=${sort}&order=${order}`
    expect(currentLocation()).toBe(expected)
  })

  it('changing the sort replaces the history entry instead of pushing one', async () => {
    renderAt(SUBJECT_URL)
    await screen.findByRole('link', { name: 'Compute' })
    expect(screen.getByTestId('navigation-type').textContent).toBe('POP')
    chooseSort('Recently updated')
    await waitFor(() => expect(currentLocation()).toBe(`${SUBJECT_URL}?sort=updatedAt&order=desc`))
    expect(screen.getByTestId('navigation-type').textContent).toBe('REPLACE')
  })

  it('a slow earlier sort never overwrites a later choice', async () => {
    const base = new InMemoryStudiesAdapter(librarySeed())
    const gates = new Map<string, () => void>()
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      listSubjectNotes: async (id: string, sort?: NoteSort) => {
        const key = `${sort?.field}:${sort?.order}`
        if (key !== 'title:asc') await new Promise<void>((resolve) => gates.set(key, resolve))
        return base.listSubjectNotes(id, sort)
      },
    })
    renderAt(SUBJECT_URL, service)
    await screen.findByRole('link', { name: 'Compute' })
    chooseSort('Z–A')
    chooseSort('Recently updated')
    await waitFor(() => expect(gates.size).toBe(2))
    await act(async () => gates.get('updatedAt:desc')!())
    await waitFor(() => expect(noteTitles()).toEqual(['Compute', 'Storage', 'Networking']))
    await act(async () => gates.get('title:desc')!())
    expect(noteTitles()).toEqual(['Compute', 'Storage', 'Networking'])
  })

  it('the URL preselects the sort, so it survives a reload (S07-7)', async () => {
    renderAt(`${SUBJECT_URL}?sort=updatedAt&order=desc`)
    await waitFor(() => expect(noteTitles()).toEqual(['Compute', 'Storage', 'Networking']))
    expect(sortSelect().selectedOptions[0].textContent).toBe('Recently updated')
  })

  it.each(['?sort=size', '?sort=title', '?sort=title&order=sideways'])(
    'an unknown sort pair (%s) falls back to A–Z silently (S07-7)',
    async (query) => {
      // Record what reaches the port: the API would answer 422 to an unknown sort.
      const received: Array<NoteSort | undefined> = []
      const base = new InMemoryStudiesAdapter(librarySeed())
      const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
        listSubjectNotes: (id: string, sort?: NoteSort) => {
          received.push(sort)
          return base.listSubjectNotes(id, sort)
        },
      })
      renderAt(SUBJECT_URL + query, service)
      await waitFor(() => expect(received.length).toBeGreaterThan(0))
      expect(received.every((s) => s?.field === 'title' && s.order === 'asc')).toBe(true)
      await waitFor(() => expect(noteTitles()).toEqual(['Compute', 'Networking', 'Storage']))
      expect(sortSelect().selectedOptions[0].textContent).toBe('A–Z')
      expect(screen.queryByRole('alert')).toBeNull()
    }
  )

  it('renders the description as the only paragraph of the header when present', async () => {
    const { container } = renderAt(SUBJECT_URL)
    await screen.findByText('Foundational AWS certification.')
    expect(container.querySelector('main header')!.querySelectorAll('p')).toHaveLength(1)
  })

  it('renders no description element when the description is null', async () => {
    const { container } = renderAt(`/studies/subjects/${IDS.azure}`)
    await screen.findByRole('heading', { level: 1, name: 'Azure' })
    expect(container.querySelector('main header')!.querySelectorAll('p')).toHaveLength(0)
  })

  it('shows "Subject not found" when the notes list reports the subject gone', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      listSubjectNotes: () => Promise.resolve(null),
    })
    renderAt(SUBJECT_URL, service)
    expect(await screen.findByText('Subject not found')).toBeTruthy()
  })

  it('"New note" links to the editor for this subject (S09b)', async () => {
    renderAt(SUBJECT_URL)
    const link = await screen.findByRole('link', { name: 'New note' })
    expect(link.getAttribute('href')).toBe(`/studies/subjects/${IDS.ccp}/notes/new`)
  })

  it('shows "No notes yet" for a subject without notes', async () => {
    renderAt(`/studies/subjects/${IDS.emptySubject}`)
    expect(await screen.findByText('No notes yet')).toBeTruthy()
  })

  it('shows "Subject not found" for an unknown id (S07-9)', async () => {
    renderAt(`/studies/subjects/${IDS.missing}`)
    expect(await screen.findByText('Subject not found')).toBeTruthy()
  })

  it('shows an Alert on a service failure', async () => {
    renderAt(SUBJECT_URL, failingService('boom'))
    expect((await screen.findByRole('alert')).textContent).toContain('boom')
  })
})
