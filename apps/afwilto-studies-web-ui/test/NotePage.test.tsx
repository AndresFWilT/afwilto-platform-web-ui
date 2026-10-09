import { describe, it, expect } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { currentLocation, failingService, renderAt } from './support/renderStudies'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError } from '../src/application/errors'
import { click, findDialog } from './support/forms'
import { IDS, librarySeed } from './fixtures'

describe('NotePage (S07-8, Slice 08)', () => {
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

  it('renders the content as sanitized Markdown (S08-13)', async () => {
    const { container } = renderAt(`/studies/notes/${IDS.compute}`)
    await screen.findByRole('heading', { level: 1, name: 'Compute' })
    expect(container.querySelector('strong')!.textContent).toBe('instances')
    expect(container.querySelector('script')).toBeNull()
  })

  it('renders math in the note body (S08-13)', async () => {
    const { container } = renderAt(`/studies/notes/${IDS.storage}`)
    await screen.findByRole('heading', { level: 1, name: 'Storage' })
    expect(container.querySelector('.katex-display')).toBeTruthy()
  })

  it('lists "Related in slab" links that navigate client-side (AC-F10, S08-9)', async () => {
    renderAt(`/studies/notes/${IDS.compute}`)
    const section = await screen.findByRole('region', { name: 'Related in slab' })
    expect(within(section).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/slab/ud/operative-systems/round-robin',
      '/slab/ud/operative-systems/mlfq-scheduler',
    ]) // stored order, not alphabetical
    const link = within(section).getByRole('link', { name: 'Round robin lab' })
    expect(link.getAttribute('href')).toBe('/slab/ud/operative-systems/round-robin')
    expect(link.getAttribute('target')).toBeNull()
    const probe = screen.getByTestId('location')
    fireEvent.click(link)
    await waitFor(() => expect(currentLocation()).toBe('/slab/ud/operative-systems/round-robin'))
    expect(screen.getByTestId('navigation-type').textContent).toBe('PUSH')
    expect(screen.getByTestId('location')).toBe(probe) // same document: no full reload
  })

  it('has no "Related in slab" section when the note has no links', async () => {
    renderAt(`/studies/notes/${IDS.storage}`)
    await screen.findByRole('heading', { level: 1, name: 'Storage' })
    expect(screen.queryByRole('region', { name: 'Related in slab' })).toBeNull()
  })

  it('still shows the note when only the subject lookup fails (the back link is optional)', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      getSubject: () => Promise.reject(new Error('subject lookup down')),
    })
    const { container } = renderAt(`/studies/notes/${IDS.compute}`, service)
    expect(await screen.findByRole('heading', { level: 1, name: 'Compute' })).toBeTruthy()
    expect(container.querySelector('strong')!.textContent).toBe('instances')
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

describe('NotePage — edit and delete (S09b-9)', () => {
  it('links to the editor', async () => {
    renderAt(`/studies/notes/${IDS.compute}`)
    const edit = await screen.findByRole('link', { name: 'Edit note' })
    expect(edit.getAttribute('href')).toBe(`/studies/notes/${IDS.compute}/edit`)
  })

  it('deletes and returns to the subject, where the note is gone', async () => {
    renderAt(`/studies/notes/${IDS.compute}`)
    await screen.findByRole('heading', { level: 1, name: 'Compute' })
    click(document.body, 'Delete note')
    click(await findDialog('Delete note “Compute”?'), 'Delete')
    expect(await screen.findByText('Note deleted')).toBeTruthy()
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${IDS.ccp}`))
    await screen.findByRole('heading', { level: 1, name: 'AWS Certified Cloud Practitioner' })
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Compute' })).toBeNull())
    expect(screen.getByRole('link', { name: 'Storage' })).toBeTruthy()
  })

  it('already deleted: says so, and closing returns to the subject', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      deleteNote: () => Promise.reject(new StudiesNotFoundError()),
    })
    renderAt(`/studies/notes/${IDS.compute}`, service)
    await screen.findByRole('heading', { level: 1, name: 'Compute' })
    click(document.body, 'Delete note')
    const dialog = await findDialog('Delete note “Compute”?')
    click(dialog, 'Delete')
    expect(await within(dialog).findByText('It was already deleted.')).toBeTruthy()
    click(dialog, 'Cancel')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/subjects/${IDS.ccp}`))
  })
})
