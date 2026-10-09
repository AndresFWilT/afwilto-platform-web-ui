import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { failingService, renderAt } from './support/renderStudies'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { IDS, librarySeed } from './fixtures'

describe('NotePage (S07-8, D-1)', () => {
  it('renders the header: title, kind, tags, subject link and dates', async () => {
    renderAt(`/studies/notes/${IDS.compute}`)
    expect(await screen.findByRole('heading', { level: 1, name: 'Compute' })).toBeTruthy()
    expect(screen.getByText('Summary')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'iam' }).getAttribute('href')).toBe('/studies/tags/iam')
    expect(screen.getByRole('link', { name: 'ec2' }).getAttribute('href')).toBe('/studies/tags/ec2')
    expect(
      screen.getByRole('link', { name: 'AWS Certified Cloud Practitioner' }).getAttribute('href')
    ).toBe(`/studies/subjects/${IDS.ccp}`)
    expect(screen.getByText(/Jan 1, 2026/)).toBeTruthy()
    expect(screen.getByText(/Jan 3, 2026/)).toBeTruthy()
  })

  it('shows the content verbatim as text, never as markup', async () => {
    const { container } = renderAt(`/studies/notes/${IDS.compute}`)
    await screen.findByRole('heading', { level: 1, name: 'Compute' })
    const pre = container.querySelector('pre')!
    expect(pre.textContent).toBe('<script>alert(1)</script>\nEC2 **instances**')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('strong')).toBeNull()
  })

  it('still shows the note when only the subject lookup fails (the back link is optional)', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      getSubject: () => Promise.reject(new Error('subject lookup down')),
    })
    const { container } = renderAt(`/studies/notes/${IDS.compute}`, service)
    expect(await screen.findByRole('heading', { level: 1, name: 'Compute' })).toBeTruthy()
    expect(container.querySelector('pre')!.textContent).toContain('EC2 **instances**')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('link', { name: 'AWS Certified Cloud Practitioner' })).toBeNull()
  })

  it('shows "Note not found" for an unknown id', async () => {
    renderAt(`/studies/notes/${IDS.missing}`)
    expect(await screen.findByText('Note not found')).toBeTruthy()
  })

  it('shows an Alert on a service failure', async () => {
    renderAt(`/studies/notes/${IDS.compute}`, failingService('boom'))
    expect((await screen.findByRole('alert')).textContent).toContain('boom')
  })
})
