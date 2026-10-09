import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Dialog, EmptyState, Input, Select, Text, useToast } from '@afwilto/design-system'
import type { Note, NoteKind, NotePatch, SlabLink, Subject } from '@/application/ports'
import { StudiesConflictError } from '@/application/errors'
import { validateContent, validateSlabLink, validateTitle } from '@/domain/noteValidation'
import { addTag } from '@/domain/tags'
import { trimSpace } from '@/domain/validation'
import { useServices } from '@/di'
import { useAsync } from '@/hooks/useAsync'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SourceEditor } from '@/features/editor/SourceEditor'
import { useUnsavedGuard } from '@/features/editor/useUnsavedGuard'
import { MarkdownView } from '@/features/markdown/MarkdownView'
import { Field } from '../shared/Field'
import { GONE_MESSAGE, toFormFailure } from '../shared/serverErrors'
import { LoadError, LoadingRows } from '../shared/states'
import { ConflictBanner } from './ConflictBanner'
import { SlabLinksEditor } from './SlabLinksEditor'
import { TagsInput } from './TagsInput'

interface Form {
  title: string
  kindId: string
  subjectId: string
  content: string
  tags: string[]
  slabLinks: SlabLink[]
}

function formOf(note: Note): Form {
  return {
    title: note.title,
    kindId: note.kind.id,
    subjectId: note.subjectId,
    content: note.content,
    tags: note.tags,
    slabLinks: note.slabLinks.map((l) => ({ ...l })),
  }
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
/** A tag set has no order (FR-5): removing and re-adding a tag is not a change. */
const sameTags = (a: string[], b: string[]) => sameJson([...a].sort(), [...b].sort())
const cleanLinks = (links: SlabLink[]) => links.map((l) => ({ label: trimSpace(l.label), path: l.path }))

type Loaded =
  | { mode: 'create'; subject: Subject | null; kinds: NoteKind[] }
  | { mode: 'edit'; note: Note | null; kinds: NoteKind[]; subjects: Subject[] }

/** `subjects/:subjectId/notes/new` and `notes/:noteId/edit` (Slice 09b). */
export function NoteEditorPage() {
  const { subjectId, noteId } = useParams()
  const { studiesService } = useServices()
  const state = useAsync<Loaded>(async () => {
    if (noteId) {
      const [note, kinds, subjects] = await Promise.all([
        studiesService.getNote(noteId),
        studiesService.listKinds(),
        studiesService.listSubjects(),
      ])
      return { mode: 'edit', note, kinds, subjects }
    }
    const [subject, kinds] = await Promise.all([studiesService.getSubject(subjectId ?? ''), studiesService.listKinds()])
    return { mode: 'create', subject, kinds }
  }, [studiesService, subjectId, noteId])

  if (state.status === 'loading') return <LoadingRows />
  if (state.status === 'error') return <LoadError error={state.error} />
  const loaded = state.data
  if (loaded.mode === 'create' && !loaded.subject) {
    return <EmptyState icon="🔎" title="Subject not found" description="It may have been deleted." />
  }
  if (loaded.mode === 'edit' && !loaded.note) {
    return <EmptyState icon="🔎" title="Note not found" description="It may have been deleted." />
  }
  return <Editor key={noteId ?? subjectId} loaded={loaded} />
}

function Editor({ loaded }: { loaded: Loaded }) {
  const { studiesService } = useServices()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const editing = loaded.mode === 'edit' ? loaded.note! : null
  const subject = loaded.mode === 'create' ? loaded.subject! : null

  const emptyForm: Form = {
    title: '',
    kindId: loaded.kinds[0]?.id ?? '',
    subjectId: subject?.id ?? '',
    content: '',
    tags: [],
    slabLinks: [],
  }
  const [base, setBase] = useState<{ form: Form; version: number }>(() =>
    editing ? { form: formOf(editing), version: editing.version } : { form: emptyForm, version: 0 }
  )
  const [form, setForm] = useState<Form>(base.form)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<string>()
  const [conflict, setConflict] = useState(false)
  const [confirmReload, setConfirmReload] = useState(false)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [tagDraft, setTagDraft] = useState('')
  // Latched while a save is in flight, and kept after a success until the
  // (transition-wrapped, lazy) navigation lands: no double create, no stale 409.
  const saving = useRef(false)
  const [busy, setBusy] = useState(false)

  const dirty = !sameJson({ ...form, tags: [...form.tags].sort() }, { ...base.form, tags: [...base.form.tags].sort() }) || tagDraft.trim() !== ''
  const guard = useUnsavedGuard(dirty)
  const preview = useDeferredValue(form.content)
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }))
  const backTo = editing ? `/studies/notes/${editing.id}` : `/studies/subjects/${subject!.id}`

  const subjectOptions = useMemo(
    () =>
      loaded.mode === 'edit'
        ? loaded.subjects
            .map((s) => ({ id: s.id, label: `${s.category.path} — ${s.name}` }))
            .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
        : [],
    [loaded]
  )

  function validate(): Record<string, string> {
    const found: Record<string, string> = {}
    const title = validateTitle(form.title)
    const content = validateContent(form.content)
    if (title) found['title'] = title
    if (content) found['content'] = content
    form.slabLinks.forEach((link, i) => {
      const e = validateSlabLink(link)
      if (e.label) found[`slabLinks[${i}].label`] = e.label
      if (e.path) found[`slabLinks[${i}].path`] = e.path
    })
    return found
  }

  const save = useCallback(async () => {
    if (saving.current) return
    const clientErrors = validate()
    // A tag typed but not added yet is part of the note (review A).
    let tags = form.tags
    if (tagDraft.trim()) {
      const added = addTag(form.tags, tagDraft)
      if (added.error) clientErrors['tags'] = added.error
      else {
        tags = added.tags
        setTagDraft('')
        setForm((f) => ({ ...f, tags }))
      }
    }
    setErrors(clientErrors)
    setAlert(undefined)
    if (Object.keys(clientErrors).length) return

    saving.current = true
    setBusy(true)
    let succeeded = false
    try {
      if (editing) {
        const patch: NotePatch = { version: base.version }
        const title = trimSpace(form.title)
        if (title !== base.form.title) patch.title = title
        if (form.kindId !== base.form.kindId) patch.kindId = form.kindId
        if (form.subjectId !== base.form.subjectId) patch.subjectId = form.subjectId
        if (form.content !== base.form.content) patch.content = form.content
        if (!sameTags(tags, base.form.tags)) patch.tags = tags
        if (!sameJson(cleanLinks(form.slabLinks), base.form.slabLinks)) patch.slabLinks = cleanLinks(form.slabLinks)
        if (Object.keys(patch).length === 1) {
          succeeded = true
          navigate(backTo)
          return
        }
        const saved = await studiesService.updateNote(editing.id, patch)
        succeeded = true
        showToast('Note saved', 'success')
        navigate(`/studies/notes/${saved.id}`)
      } else {
        const created = await studiesService.createNote(subject!.id, {
          title: trimSpace(form.title),
          kindId: form.kindId,
          content: form.content,
          tags,
          slabLinks: cleanLinks(form.slabLinks),
        })
        succeeded = true
        showToast('Note created', 'success')
        navigate(`/studies/notes/${created.id}`)
      }
    } catch (err) {
      if (err instanceof StudiesConflictError && err.rule === 'stale_version') {
        setConflict(true)
        showToast('This note changed since you opened it', 'error')
        return
      }
      const tagFields = tags.map((_, i) => `tags[${i}]`)
      const linkFields = form.slabLinks.flatMap((_, i) => [`slabLinks[${i}].label`, `slabLinks[${i}].path`])
      const failure = toFormFailure(err, ['title', 'content', 'kindId', 'subjectId', 'tags', 'slabLinks', ...tagFields, ...linkFields])
      // tags[i] from the server shows once, under the Tags field (review F).
      for (const field of tagFields) {
        if (failure.fields[field]) {
          failure.fields['tags'] ??= failure.fields[field]
          delete failure.fields[field]
        }
      }
      setErrors(failure.fields)
      // A 404 on create means the subject is gone, not the note (review H).
      setAlert(failure.gone ? (editing ? GONE_MESSAGE : 'The subject was deleted.') : failure.alert)
      if (failure.unexpected) showToast(failure.unexpected, 'error')
    } finally {
      if (!succeeded) {
        saving.current = false
        setBusy(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, base, editing, subject, tagDraft])

  // Ctrl/Cmd+S anywhere on the page; CodeMirror handles (and prevents) its own.
  const saveRef = useRef(save)
  saveRef.current = save
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return
      e.preventDefault()
      void saveRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function reloadLatest() {
    setConfirmReload(false)
    let latest: Note | null
    try {
      latest = await studiesService.getNote(editing!.id)
    } catch (e) {
      setAlert(e instanceof Error ? e.message : String(e)) // the user's text stays (review E)
      return
    }
    if (!latest) {
      setAlert(GONE_MESSAGE)
      return
    }
    const next = { form: formOf(latest), version: latest.version }
    setBase(next)
    setForm(next.form)
    setConflict(false)
    setErrors({})
  }

  const tabsId = useId()
  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${active ? 'bg-brand-700 text-primary-300' : 'text-neutral-400 hover:text-neutral-100'}`
  // Chosen in JS, not with lg:/hidden utilities: two Tailwind builds share the page.
  const wide = useMediaQuery('(min-width: 1024px)', true)
  const twoColumnFields = useMediaQuery('(min-width: 768px)', true)
  const paneTitle = (title: string) => (
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{title}</h2>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Text variant="h1" color="default">{editing ? 'Edit note' : 'New note'}</Text>
          {subject && <Text variant="small" color="muted">in {subject.name}</Text>}
        </div>
        <span className="flex gap-2">
          <Button variant="ghost" onClick={() => guard.requestLeave(backTo)}>Cancel</Button>
          <Button onClick={() => void save()} loading={busy} disabled={busy}>Save</Button>
        </span>
      </div>

      {conflict && <ConflictBanner content={form.content} onReload={() => setConfirmReload(true)} />}
      {alert && <Alert variant="error">{alert}</Alert>}

      <div className="grid gap-4" style={{ gridTemplateColumns: twoColumnFields ? '1fr 1fr' : '1fr' }}>
        <Field label="Title" error={errors['title']}>
          {(props) => <Input {...props} value={form.title} onChange={(e) => set('title', e.target.value)} error={Boolean(errors['title'])} />}
        </Field>
        <Field label="Kind" error={errors['kindId']}>
          {(props) => (
            <Select {...props} value={form.kindId} onChange={(e) => set('kindId', e.target.value)}>
              {loaded.kinds.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </Select>
          )}
        </Field>
        {editing && (
          <Field label="Subject" error={errors['subjectId']}>
            {(props) => (
              <Select {...props} value={form.subjectId} onChange={(e) => set('subjectId', e.target.value)}>
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <div style={{ gridColumn: '1 / -1' }}>
          <TagsInput tags={form.tags} onChange={(tags) => set('tags', tags)} draft={tagDraft} onDraftChange={setTagDraft} error={errors['tags']} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!wide && (
          <div role="tablist" aria-label="Editor panes" className="flex gap-1">
            <button id={`${tabsId}-write`} role="tab" type="button" aria-selected={tab === 'write'} aria-controls={`${tabsId}-write-panel`}
              className={tabClass(tab === 'write')} onClick={() => setTab('write')}>
              Write
            </button>
            <button id={`${tabsId}-preview`} role="tab" type="button" aria-selected={tab === 'preview'} aria-controls={`${tabsId}-preview-panel`}
              className={tabClass(tab === 'preview')} onClick={() => setTab('preview')}>
              Preview
            </button>
          </div>
        )}
        <div className="grid gap-4" style={{ gridTemplateColumns: wide ? '1fr 1fr' : '1fr' }}>
          {/* Both panes stay mounted; the inactive tab's pane is `hidden` (an attribute, not
              a Tailwind class), so CodeMirror keeps its undo history and cursor. */}
          <div id={`${tabsId}-write-panel`} role={wide ? undefined : 'tabpanel'} aria-labelledby={wide ? undefined : `${tabsId}-write`}
            hidden={!wide && tab !== 'write'} className="min-w-0">
            {wide && paneTitle('Markdown')}
            <SourceEditor value={form.content} onChange={(content) => set('content', content)} onSave={() => void save()} />
            {errors['content'] && <p className="mt-1 text-xs text-red-400">{errors['content']}</p>}
          </div>
          <div id={`${tabsId}-preview-panel`} role={wide ? undefined : 'tabpanel'} aria-labelledby={wide ? undefined : `${tabsId}-preview`}
            hidden={!wide && tab !== 'preview'} className="min-w-0">
            {wide && paneTitle('Preview')}
            <section aria-label="Preview" className="min-h-[24rem] rounded-lg border border-dashed border-primary-500/40 bg-surface-raised p-4">
              <MarkdownView content={preview} />
            </section>
          </div>
        </div>
      </div>

      <SlabLinksEditor
        links={form.slabLinks}
        onChange={(links) => {
          // Row errors are keyed by index; after a removal they would land on the wrong row (review I).
          if (links.length < form.slabLinks.length) {
            setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('slabLinks'))))
          }
          set('slabLinks', links)
        }}
        errors={errors}
      />

      {guard.dialog}
      {confirmReload && (
        <Dialog
          open
          onClose={() => setConfirmReload(false)}
          title="Reload latest version?"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmReload(false)}>Keep my edits</Button>
              <Button variant="danger" onClick={() => void reloadLatest()}>Discard and reload</Button>
            </>
          }
        >
          <p className="text-sm text-neutral-300">Discard your edits and load the latest version?</p>
        </Dialog>
      )}
    </div>
  )
}
