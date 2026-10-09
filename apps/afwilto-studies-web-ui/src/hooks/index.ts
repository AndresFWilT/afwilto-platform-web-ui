import type { NoteSort } from '@/application/ports'
import { useServices } from '@/di'
import { useAsync } from './useAsync'

export type { AsyncState } from './useAsync'

export function useLibrary() {
  const { studiesService } = useServices()
  return useAsync(async () => {
    const [categories, subjects] = await Promise.all([studiesService.listCategories(), studiesService.listSubjects()])
    return { categories, subjects }
  }, [studiesService])
}

export function useSubject(subjectId: string, reload = 0) {
  const { studiesService } = useServices()
  return useAsync(() => studiesService.getSubject(subjectId), [studiesService, subjectId, reload])
}

export function useSubjectNotes(subjectId: string, sort: NoteSort) {
  const { studiesService } = useServices()
  return useAsync(
    () => studiesService.listSubjectNotes(subjectId, sort),
    [studiesService, subjectId, sort.field, sort.order]
  )
}

/**
 * The note plus its subject for the back link; null when the note is gone.
 * The subject is best-effort: if its lookup fails the note still renders.
 */
export function useNote(noteId: string) {
  const { studiesService } = useServices()
  return useAsync(async () => {
    const note = await studiesService.getNote(noteId)
    if (!note) return null
    const subject = await studiesService.getSubject(note.subjectId).catch(() => null)
    return { note, subject }
  }, [studiesService, noteId])
}

export function useTagNotes(tag: string, sort: NoteSort) {
  const { studiesService } = useServices()
  return useAsync(() => studiesService.listNotesByTag(tag, sort), [studiesService, tag, sort.field, sort.order])
}
