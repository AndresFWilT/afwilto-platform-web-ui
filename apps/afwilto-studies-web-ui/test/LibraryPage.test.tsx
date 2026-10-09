import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { failingService, renderAt } from './support/renderStudies'
import { D1, IDS } from './fixtures'

const CCP = 'AWS Certified Cloud Practitioner'

describe('LibraryPage (AC-F3)', () => {
  it('renders every category with its color chip (S07-4)', async () => {
    renderAt('/studies')
    for (const name of ['TI', 'Cloud', 'AWS', 'Math']) {
      expect(await screen.findByText(name)).toBeTruthy()
    }
    expect(screen.getByTestId(`color-chip-${IDS.aws}`).style.backgroundColor).toBe('rgb(255, 153, 0)')
    expect(screen.getByTestId(`color-chip-${IDS.ti}`).style.backgroundColor).toBe('rgb(59, 130, 246)')
  })

  it('lists roots in name order, before their descendants', async () => {
    renderAt('/studies')
    await screen.findByText('Math')
    const text = screen.getByRole('main').textContent ?? ''
    expect(text.indexOf('Math')).toBeLessThan(text.indexOf('TI'))
    expect(text.indexOf('TI')).toBeLessThan(text.indexOf('Cloud'))
    expect(text.indexOf('Cloud')).toBeLessThan(text.indexOf('AWS'))
  })

  it('lists each subject under its category as a link with its note count (S07-4)', async () => {
    renderAt('/studies')
    const link = await screen.findByRole('link', { name: new RegExp(CCP) })
    expect(link.getAttribute('href')).toBe(`/studies/subjects/${IDS.ccp}`)
    expect(link.textContent).toContain('3')
    expect(screen.getByRole('link', { name: /Azure/ }).getAttribute('href')).toBe(`/studies/subjects/${IDS.azure}`)
  })

  it('starts expanded; collapsing TI hides its subtree and expanding shows it again (S07-4, D-3)', async () => {
    renderAt('/studies')
    const toggle = await screen.findByRole('button', { name: 'Collapse TI' })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('AWS')).toBeTruthy()

    fireEvent.click(toggle)
    const expand = screen.getByRole('button', { name: 'Expand TI' })
    expect(expand.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Cloud')).toBeNull()
    expect(screen.queryByText('AWS')).toBeNull()
    expect(screen.queryByRole('link', { name: new RegExp(CCP) })).toBeNull()
    expect(screen.getByText('Math')).toBeTruthy()

    fireEvent.click(expand)
    expect(screen.getByText('Cloud')).toBeTruthy()
    expect(screen.getByText('AWS')).toBeTruthy()
    expect(screen.getByRole('link', { name: new RegExp(CCP) })).toBeTruthy()
  })

  it('orders the subjects of a category by name, case-insensitive, and shows the counts', async () => {
    const subject = (id: string, name: string) => ({ id, categoryId: IDS.ti, name, description: null, createdAt: D1, updatedAt: D1 })
    const seed = {
      categories: [{ id: IDS.ti, parentId: null, name: 'TI', color: '#3B82F6' }],
      kinds: [],
      subjects: [subject('s3', 'zeta'), subject('s1', 'beta'), subject('s2', 'Alpha')],
      notes: [],
    }
    // The page owns the visible order; feed it an unsorted list to prove it.
    const base = new InMemoryStudiesAdapter(seed)
    const unsorted = async () => (await base.listSubjects()).reverse()
    renderAt('/studies', Object.assign(new InMemoryStudiesAdapter(seed), { listSubjects: unsorted }))
    await screen.findByText('TI')
    const names = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/studies/subjects/'))
    expect(names.map((a) => a.textContent)).toEqual(['📘Alpha0 notes', '📘beta0 notes', '📘zeta0 notes'])
    expect(screen.getByText('3 subjects')).toBeTruthy()
  })

  it('shows the singular count for one subject and one note', async () => {
    renderAt('/studies')
    expect(await screen.findAllByText('1 subject')).toHaveLength(3) // Cloud (Azure), AWS (CCP), Math (Calculus)
    expect(screen.getByRole('link', { name: /Azure/ }).textContent).toContain('1 note')
  })

  it('shows "No categories yet" for an empty library (S07-5)', async () => {
    renderAt('/studies', new InMemoryStudiesAdapter({ categories: [], kinds: [], subjects: [], notes: [] }))
    expect(await screen.findByText('No categories yet')).toBeTruthy()
  })

  it('shows an Alert with the service message on failure; the navbar stays (S07-5)', async () => {
    renderAt('/studies', failingService('studies-mngr is unreachable'))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('studies-mngr is unreachable')
    expect(screen.getByRole('navigation')).toBeTruthy()
  })
})
