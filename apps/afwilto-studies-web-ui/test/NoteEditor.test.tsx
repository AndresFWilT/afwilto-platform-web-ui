import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { InMemoryStudiesAdapter } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { StudiesNotFoundError, StudiesValidationError } from '../src/application/errors'
import { currentLocation, renderAt } from './support/renderStudies'
import { choose, click, errorFor, fieldValue, fill, findDialog, optionTexts, selectedText } from './support/forms'
import { IDS, librarySeed } from './fixtures'

// CodeMirror runs in its own test (S09b-11); here the source editor is a textarea
// with the same contract, so page behavior is deterministic.
vi.mock('../src/features/editor/SourceEditor', () => ({
  SourceEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Markdown source" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const page = () => document.body
const NEW_URL = `/studies/subjects/${IDS.ccp}/notes/new`
const EDIT_URL = `/studies/notes/${IDS.compute}/edit`

let confirmSpy: ReturnType<typeof vi.spyOn>
let writeText: ReturnType<typeof vi.fn>
beforeEach(() => {
  confirmSpy = vi.spyOn(window, 'confirm')
  writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})
afterEach(() => {
  expect(confirmSpy).not.toHaveBeenCalled() // AC-F8: never a native dialog
  confirmSpy.mockRestore()
  Reflect.deleteProperty(window, 'matchMedia') // jsdom has none: the editor then assumes a desktop
})

async function openNew(service = new InMemoryStudiesAdapter(librarySeed())) {
  renderAt(NEW_URL, service)
  await screen.findByRole('heading', { level: 1, name: 'New note' })
  await waitFor(() => expect(selectedText(page(), 'Kind')).not.toBe(''))
  return service
}

async function openEdit(service = new InMemoryStudiesAdapter(librarySeed())) {
  renderAt(EDIT_URL, service)
  await screen.findByRole('heading', { level: 1, name: 'Edit note' })
  await waitFor(() => expect(fieldValue(page(), 'Title')).toBe('Compute'))
  return service
}

function source(value: string) {
  fireEvent.change(screen.getByLabelText('Markdown source'), { target: { value } })
}

function addTag(raw: string) {
  const input = screen.getByLabelText('Tags')
  fireEvent.change(input, { target: { value: raw } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

function chips(): string[] {
  return screen.queryAllByRole('button', { name: /^Remove tag / }).map((b) => b.getAttribute('aria-label')!.replace('Remove tag ', ''))
}

describe('Editor layout (AC-F7, S09b-4)', () => {
  it('shows the fields, the first kind alphabetically, and a live preview', async () => {
    viewport(true)
    await openNew()
    expect(optionTexts(page(), 'Kind')).toEqual(['Cheat sheet', 'Summary'])
    expect(selectedText(page(), 'Kind')).toBe('Cheat sheet')
    expect(screen.queryByLabelText('Subject')).toBeNull() // a new note belongs to its URL subject
    source('# Hello\n\n$$x^2$$')
    const preview = screen.getByRole('region', { name: 'Preview' })
    await waitFor(() => expect(within(preview).getByRole('heading', { name: 'Hello' })).toBeTruthy())
    expect(preview.querySelector('.katex-display')).toBeTruthy()
  })

  it('offers alive kinds only (AC-F12)', async () => {
    const seed = librarySeed()
    seed.kinds.push({ id: '00000000-0000-7000-8000-0000000000c9', name: 'Archived', deletedAt: '2026-01-04T12:00:00.000Z' })
    await openNew(new InMemoryStudiesAdapter(seed))
    expect(optionTexts(page(), 'Kind')).not.toContain('Archived')
  })

  function viewport(desktop: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: desktop && query === '(min-width: 1024px)',
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
  }

  it('desktop: both panes side by side under visible headings, no tabs', async () => {
    viewport(true)
    await openNew()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Markdown' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeTruthy()
    expect(screen.getByLabelText('Markdown source')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Preview' })).toBeTruthy()
  })

  it('narrow: Write/Preview tabs show one pane at a time', async () => {
    viewport(false)
    await openNew()
    expect(screen.getByRole('tab', { name: 'Write' }).getAttribute('aria-selected')).toBe('true')
    const source = screen.getByLabelText('Markdown source')
    expect(source.closest('[role=tabpanel]')!.hasAttribute('hidden')).toBe(false)
    expect(screen.queryByRole('region', { name: 'Preview' })).toBeNull() // hidden panes are not exposed
    fireEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(screen.getByRole('tab', { name: 'Preview' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('region', { name: 'Preview' })).toBeTruthy()
    expect(source.closest('[role=tabpanel]')!.hasAttribute('hidden')).toBe(true)
    fireEvent.click(screen.getByRole('tab', { name: 'Write' }))
    // The editor was kept mounted, not rebuilt: undo history, cursor and focus survive.
    expect(screen.getByLabelText('Markdown source')).toBe(source)
    for (const tab of screen.getAllByRole('tab')) {
      expect(document.getElementById(tab.getAttribute('aria-controls')!)).toBeTruthy()
    }
  })

  it.each([
    ['Ctrl+S', { ctrlKey: true }],
    ['Cmd+S', { metaKey: true }],
  ])('%s saves', async (_name, mods) => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    fill(page(), 'Title', 'Shortcut')
    const event = new KeyboardEvent('keydown', { key: 's', bubbles: true, cancelable: true, ...mods })
    window.dispatchEvent(event)
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(event.defaultPrevented).toBe(true)
  })
})

describe('Create (S09b-5)', () => {
  it('posts trimmed title, kind, content, normalized tags and links, then lands on the note', async () => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    fill(page(), 'Title', '  Lambda ')
    choose(page(), 'Kind', 'Summary')
    source('# Lambda')
    addTag(' Cloud Security ')
    addTag('IAM')
    addTag('iam')
    expect(chips()).toEqual(['cloud-security', 'iam'])
    click(page(), 'Add slab link')
    fill(page(), 'Link 1 label', ' Lab ')
    fill(page(), 'Link 1 path', '/slab/ud/operative-systems')
    click(page(), 'Save')
    expect(await screen.findByRole('heading', { level: 1, name: 'Lambda' })).toBeTruthy()
    expect(screen.getByText('Note created')).toBeTruthy()
    expect(create).toHaveBeenCalledWith(IDS.ccp, {
      title: 'Lambda',
      kindId: IDS.summary,
      content: '# Lambda',
      tags: ['cloud-security', 'iam'],
      slabLinks: [{ label: 'Lab', path: '/slab/ud/operative-systems' }],
    })
    expect(currentLocation()).toMatch(/^\/studies\/notes\/[0-9a-f-]{36}$/)
  })

  it('Enter, a comma, or leaving the field adds the tag', async () => {
    await openNew()
    addTag('one')
    const input = screen.getByLabelText('Tags')
    fireEvent.change(input, { target: { value: 'two' } })
    fireEvent.keyDown(input, { key: ',' })
    fireEvent.change(input, { target: { value: 'three' } })
    fireEvent.blur(input)
    expect(chips()).toEqual(['one', 'two', 'three'])
  })

  it('a typed but uncommitted tag is saved with the note (A)', async () => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    fill(page(), 'Title', 'Pending')
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'pending' } })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }))
    await waitFor(() => expect(create).toHaveBeenCalledWith(IDS.ccp, expect.objectContaining({ tags: ['pending'] })))
  })

  it('an invalid uncommitted tag blocks the save with its message (A)', async () => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    fill(page(), 'Title', 'Pending')
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'bad_tag!' } })
    click(page(), 'Save')
    await waitFor(() => expect(errorFor(page(), 'Tags')).toBe('Tags are lowercase words joined by dashes (max 40 characters)'))
    expect(create).not.toHaveBeenCalled()
    expect(currentLocation()).toBe(NEW_URL)
  })

  it('an uncommitted tag makes the form dirty (A)', async () => {
    await openNew()
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'draft' } })
    const e = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })

  it('a second save while one is in flight or just succeeded sends nothing (B)', async () => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    fill(page(), 'Title', 'Once')
    const save = screen.getByRole('button', { name: 'Save' }) // its label changes while loading
    fireEvent.click(save)
    fireEvent.click(save)
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    await create.mock.results[0].value
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }))
    await screen.findByRole('heading', { level: 1, name: 'Once' })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('a link row error does not move to another row when a row is removed (I)', async () => {
    await openNew()
    fill(page(), 'Title', 'Links')
    click(page(), 'Add slab link')
    click(page(), 'Add slab link')
    fill(page(), 'Link 1 label', 'Bad')
    fill(page(), 'Link 1 path', '/finance')
    fill(page(), 'Link 2 label', 'Good')
    fill(page(), 'Link 2 path', '/slab/ud')
    click(page(), 'Save')
    await waitFor(() => expect(errorFor(page(), 'Link 1 path')).toBe('Use a path like /slab/ud/operative-systems'))
    click(page(), 'Remove link 1')
    expect(fieldValue(page(), 'Link 1 label')).toBe('Good')
    expect(errorFor(page(), 'Link 1 path')).toBeNull()
  })

  it('a create whose subject was deleted meanwhile says so (H)', async () => {
    const service = await openNew()
    Object.assign(service, { createNote: () => Promise.reject(new StudiesNotFoundError()) })
    fill(page(), 'Title', 'Orphan')
    click(page(), 'Save')
    expect(await screen.findByText('The subject was deleted.')).toBeTruthy()
  })

  it('an invalid tag is refused at the input with its message', async () => {
    await openNew()
    addTag('bad_tag!')
    expect(chips()).toEqual([])
    expect(errorFor(page(), 'Tags')).toBe('Tags are lowercase words joined by dashes (max 40 characters)')
  })

  it('client errors on title and links block the request', async () => {
    const service = await openNew()
    const create = vi.spyOn(service, 'createNote')
    click(page(), 'Add slab link')
    fill(page(), 'Link 1 path', '/finance')
    click(page(), 'Save')
    expect(errorFor(page(), 'Title')).toBe('Title is required')
    expect(errorFor(page(), 'Link 1 label')).toBe('Label is required')
    expect(errorFor(page(), 'Link 1 path')).toBe('Use a path like /slab/ud/operative-systems')
    expect(create).not.toHaveBeenCalled()
  })

  it('a server tag violation shows under Tags', async () => {
    const service = Object.assign(new InMemoryStudiesAdapter(librarySeed()), {
      createNote: () =>
        Promise.reject(new StudiesValidationError([{ field: 'tags[0]', rule: 'format', message: 'tag must be lowercase kebab-case, 1–40 characters' }])),
    })
    await openNew(service)
    fill(page(), 'Title', 'Tagged')
    addTag('ok')
    click(page(), 'Save')
    await waitFor(() => expect(errorFor(page(), 'Tags')).toBe('tag must be lowercase kebab-case, 1–40 characters'))
    expect(screen.getAllByText('tag must be lowercase kebab-case, 1–40 characters')).toHaveLength(1) // not also in an alert (F)
  })

  it('a server duplicate title shows under Title and keeps the input', async () => {
    await openNew()
    fill(page(), 'Title', 'compute')
    click(page(), 'Save')
    await waitFor(() => expect(errorFor(page(), 'Title')).toBe('a note with this title already exists in the subject'))
    expect(fieldValue(page(), 'Title')).toBe('compute')
  })

  it('an unknown subject shows "Subject not found" (S09b-10)', async () => {
    renderAt(`/studies/subjects/${IDS.missing}/notes/new`)
    expect(await screen.findByText('Subject not found')).toBeTruthy()
  })
})

describe('Edit (S09b-6)', () => {
  it('is prefilled from the note', async () => {
    await openEdit()
    expect(selectedText(page(), 'Kind')).toBe('Summary')
    expect(selectedText(page(), 'Subject')).toBe('TI / Cloud / AWS — AWS Certified Cloud Practitioner')
    expect((screen.getByLabelText('Markdown source') as HTMLTextAreaElement).value).toBe('<script>alert(1)</script>\nEC2 **instances**')
    expect(chips()).toEqual(['ec2', 'iam'])
    expect(fieldValue(page(), 'Link 2 path')).toBe('/slab/ud/operative-systems/mlfq-scheduler')
  })

  it('sends the loaded version and only what changed, then shows the note', async () => {
    const service = await openEdit()
    const update = vi.spyOn(service, 'updateNote')
    source('EC2 *rewritten*')
    click(page(), 'Remove tag ec2')
    click(page(), 'Save')
    expect(await screen.findByText('Note saved')).toBeTruthy()
    expect(update).toHaveBeenCalledWith(IDS.compute, { version: 3, content: 'EC2 *rewritten*', tags: ['iam'] })
    await waitFor(() => expect(currentLocation()).toBe(`/studies/notes/${IDS.compute}`))
  })

  it('removing and re-adding a tag is not a change (G)', async () => {
    const service = await openEdit()
    const update = vi.spyOn(service, 'updateNote')
    click(page(), 'Remove tag ec2')
    addTag('ec2')
    click(page(), 'Save')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/notes/${IDS.compute}`))
    expect(update).not.toHaveBeenCalled()
  })

  it('an unchanged form sends nothing and goes back to the note', async () => {
    const service = await openEdit()
    const update = vi.spyOn(service, 'updateNote')
    fill(page(), 'Title', ' Compute ')
    click(page(), 'Save')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/notes/${IDS.compute}`))
    expect(update).not.toHaveBeenCalled()
  })

  it('moving to another subject sends subjectId (D-2)', async () => {
    const service = await openEdit()
    const update = vi.spyOn(service, 'updateNote')
    choose(page(), 'Subject', 'TI / Cloud — Azure')
    click(page(), 'Save')
    await waitFor(() => expect(update).toHaveBeenCalledWith(IDS.compute, { version: 3, subjectId: IDS.azure }))
    expect(await screen.findByRole('link', { name: 'Azure' })).toBeTruthy()
  })

  it('an unknown note shows "Note not found" (S09b-10)', async () => {
    renderAt(`/studies/notes/${IDS.missing}/edit`)
    expect(await screen.findByText('Note not found')).toBeTruthy()
  })
})

describe('Stale version (AC-F9, S09b-7)', () => {
  async function conflict() {
    const service = await openEdit()
    await service.updateNote(IDS.compute, { version: 3, content: 'theirs' }) // another tab saves first
    source('mine')
    click(page(), 'Save')
    expect(await screen.findByText('This note changed since you opened it')).toBeTruthy()
    return service
  }

  it('keeps the typed text and offers both actions', async () => {
    await conflict()
    expect((screen.getByLabelText('Markdown source') as HTMLTextAreaElement).value).toBe('mine')
    const banner = screen.getByRole('alert')
    expect(within(banner).getByRole('button', { name: 'Reload latest' })).toBeTruthy()
    expect(within(banner).getByRole('button', { name: 'Copy my text' })).toBeTruthy()
  })

  it('"Copy my text" copies the current content', async () => {
    await conflict()
    click(page(), 'Copy my text')
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('mine'))
    expect(await screen.findByText('Copied')).toBeTruthy()
  })

  it('"Copy my text" reports a failed copy', async () => {
    await conflict()
    writeText.mockRejectedValue(new Error('denied'))
    click(page(), 'Copy my text')
    expect(await screen.findByText('Copy failed')).toBeTruthy()
  })

  it('a failed "Reload latest" says so and keeps the user\'s text (E)', async () => {
    const service = await conflict()
    Object.assign(service, { getNote: () => Promise.reject(new Error('network down')) })
    click(page(), 'Reload latest')
    click(await findDialog('Reload latest version?'), 'Discard and reload')
    expect(await screen.findByText('network down')).toBeTruthy()
    expect((screen.getByLabelText('Markdown source') as HTMLTextAreaElement).value).toBe('mine')
  })

  it('"Reload latest" asks first, then loads the server note; the next save uses the new version', async () => {
    const service = await conflict()
    const update = vi.spyOn(service, 'updateNote')
    click(page(), 'Reload latest')
    const dialog = await findDialog('Reload latest version?')
    expect(within(dialog).getByText('Discard your edits and load the latest version?')).toBeTruthy()
    click(dialog, 'Discard and reload')
    await waitFor(() => expect((screen.getByLabelText('Markdown source') as HTMLTextAreaElement).value).toBe('theirs'))
    expect(screen.queryByRole('alert')).toBeNull()
    fill(page(), 'Title', 'Compute v5')
    click(page(), 'Save')
    expect(await screen.findByText('Note saved')).toBeTruthy()
    expect(update).toHaveBeenLastCalledWith(IDS.compute, { version: 4, title: 'Compute v5' })
  })
})

describe('Unsaved-changes guard (AC-F8, S09b-8, D-1)', () => {
  const navLink = (name: string) => within(screen.getAllByRole('navigation')[0]).getByRole('link', { name })

  it('a navbar link while dirty asks first; "Keep editing" stays, "Discard" leaves', async () => {
    await openEdit()
    fill(page(), 'Title', 'Changed')
    expect(fireEvent.click(navLink('Studies'))).toBe(false) // the click was cancelled: no full page load
    const dialog = await findDialog('Discard unsaved changes?')
    // react-router navigates inside a transition (the target route is lazy), so a
    // navigation that slipped through would land late: assert it never does.
    await expect(waitFor(() => expect(currentLocation()).not.toBe(EDIT_URL), { timeout: 1500 })).rejects.toThrow()
    click(dialog, 'Keep editing')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(fieldValue(page(), 'Title')).toBe('Changed')
    fireEvent.click(navLink('Studies'))
    click(await findDialog('Discard unsaved changes?'), 'Discard')
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
  })

  it('does not intercept modified clicks, new-tab links, or links to the current route', async () => {
    await openEdit()
    // `abs` is same-origin but absolute, so MarkdownView opens it in a new tab: nothing to guard.
    source(`[ext](https://example.com) and [self](${EDIT_URL}) and [abs](${window.location.origin}/studies)`)
    fill(page(), 'Title', 'Changed')
    const preview = screen.getByRole('region', { name: 'Preview' })
    await waitFor(() => expect(within(preview).getByRole('link', { name: 'ext' })).toBeTruthy())
    fireEvent.click(navLink('Studies'), { ctrlKey: true })
    fireEvent.click(within(preview).getByRole('link', { name: 'ext' }))
    fireEvent.click(within(preview).getByRole('link', { name: 'self' }))
    const abs = within(preview).getByRole('link', { name: 'abs' })
    expect(abs.getAttribute('target')).toBe('_blank')
    fireEvent.click(abs)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('a clean form navigates without asking', async () => {
    await openEdit()
    fireEvent.click(navLink('Studies'))
    await waitFor(() => expect(currentLocation()).toBe('/studies'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Cancel when clean leaves at once', async () => {
    await openEdit()
    click(page(), 'Cancel')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/notes/${IDS.compute}`))
  })

  it('Cancel when dirty asks first', async () => {
    await openNew()
    source('draft')
    click(page(), 'Cancel')
    expect(await findDialog('Discard unsaved changes?')).toBeTruthy()
    expect(currentLocation()).toBe(NEW_URL)
  })

  it('tab close / reload is guarded only while dirty', async () => {
    await openEdit()
    const unload = () => {
      const e = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(e)
      return e.defaultPrevented
    }
    expect(unload()).toBe(false)
    fill(page(), 'Title', 'Changed')
    expect(unload()).toBe(true)
    fill(page(), 'Title', 'Compute') // back to the loaded value: clean again
    expect(unload()).toBe(false)
  })

  it('after a successful save the navigation is not interrupted', async () => {
    await openEdit()
    fill(page(), 'Title', 'Compute 2')
    click(page(), 'Save')
    await waitFor(() => expect(currentLocation()).toBe(`/studies/notes/${IDS.compute}`))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
