import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { App } from '../../src/App'
import type { IStudiesService } from '../../src/application/ports'
import { InMemoryStudiesAdapter } from '../../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { InMemoryExamsAdapter } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { librarySeed } from '../fixtures'

function LocationProbe() {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()
  return (
    <>
      <output data-testid="location">{pathname + search}</output>
      <output data-testid="navigation-type">{navigationType}</output>
    </>
  )
}

/** Mounts the exposed App under /studies/* exactly as the shell does. */
export function renderAt(url: string, service: IStudiesService = new InMemoryStudiesAdapter(librarySeed())) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LocationProbe />
      <Routes>
        <Route path="/studies/*" element={<App value={{ studiesService: service, examsService: new InMemoryExamsAdapter({ exams: [], media: {} }) }} />} />
      </Routes>
    </MemoryRouter>
  )
}

export function currentLocation(): string {
  return screen.getByTestId('location').textContent ?? ''
}

/** Titles of the note links currently rendered, in DOM order. */
export function noteTitles(): string[] {
  return screen
    .queryAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('/studies/notes/'))
    .map((a) => a.textContent ?? '')
}

/** A service whose every read rejects with the given message. */
export function failingService(message: string): IStudiesService {
  const fail = () => Promise.reject(new Error(message))
  return {
    listCategories: fail,
    listSubjects: fail,
    getSubject: fail,
    listSubjectNotes: fail,
    getNote: fail,
    listNotesByTag: fail,
    createCategory: fail,
    updateCategory: fail,
    deleteCategory: fail,
    listKinds: fail,
    createKind: fail,
    renameKind: fail,
    deleteKind: fail,
    createSubject: fail,
    updateSubject: fail,
    deleteSubject: fail,
    createNote: fail,
    updateNote: fail,
    deleteNote: fail,
  }
}
