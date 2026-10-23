import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { routes, childRoutes } from '../src/router'
import type { IStudiesService } from '../src/application/ports'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { renderAt } from './support/renderStudies'
import { librarySeed } from './fixtures'

describe('route table (parent §9.1, Slice 07 scope)', () => {
  it('wraps every page in a single layout route', () => {
    expect(routes).toHaveLength(1)
    expect(routes[0].element).toBeTruthy()
    expect(routes[0].children).toBe(childRoutes)
  })

  it('declares exactly the read-path and exam-management routes, all relative', () => {
    const paths = childRoutes.map((r) => r.path)
    expect(paths).toEqual([
      '',
      'categories',
      'categories/:categoryId',
      'kinds',
      'subjects/:subjectId',
      'subjects/:subjectId/exams',
      'subjects/:subjectId/exams/new',
      'subjects/:subjectId/notes/new',
      'exams/:examId',
      'notes/:noteId',
      'notes/:noteId/edit',
      'tags/:tag',
      '*',
    ])
  })
})

describe('App chrome and isolation', () => {
  it('renders the studies navbar: Home, Studies, Categories, Kinds (S09a-10)', async () => {
    renderAt('/studies')
    const nav = screen.getByRole('navigation')
    const hrefs = Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    for (const href of ['/', '/studies', '/studies/categories', '/studies/kinds']) expect(hrefs).toContain(href)
    await screen.findByText('TI')
  })

  it('an unknown in-app path renders "Not found" inside the layout (S07-9)', async () => {
    renderAt('/studies/nope')
    expect(await screen.findByText('Not found')).toBeTruthy()
    expect(screen.getByRole('navigation')).toBeTruthy()
  })

  it('a render error in a page is contained by its boundary; the navbar survives', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // A malformed payload (null instead of a list) makes the page throw while rendering.
    const broken: IStudiesService = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      listCategories: () => Promise.resolve(null as never),
    })
    renderAt('/studies', broken)
    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    expect(screen.getByRole('navigation')).toBeTruthy()
    vi.mocked(console.error).mockRestore()
  })
})
