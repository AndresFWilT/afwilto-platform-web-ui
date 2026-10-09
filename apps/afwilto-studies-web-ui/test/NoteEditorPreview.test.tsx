import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderAt } from './support/renderStudies'
import { IDS } from './fixtures'

// C: the preview re-renders only when the content it shows changes, not on
// every keystroke elsewhere in the form.
const renders = vi.hoisted(() => ({ count: 0 }))
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => {
    renders.count++
    return <div data-testid="md">{children}</div>
  },
}))
vi.mock('../src/features/editor/SourceEditor', () => ({
  SourceEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Markdown source" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

describe('Editor preview rendering (C)', () => {
  it('typing in the title does not re-render the preview', async () => {
    renderAt(`/studies/notes/${IDS.compute}/edit`)
    await screen.findByRole('heading', { level: 1, name: 'Edit note' })
    await waitFor(() => expect(screen.getByTestId('md')).toBeTruthy())
    const before = renders.count
    for (const value of ['C', 'Co', 'Com']) fireEvent.change(screen.getByLabelText('Title'), { target: { value } })
    expect(renders.count).toBe(before)
  })

  it('changing the content re-renders the preview with the new text', async () => {
    renderAt(`/studies/notes/${IDS.compute}/edit`)
    await screen.findByRole('heading', { level: 1, name: 'Edit note' })
    fireEvent.change(screen.getByLabelText('Markdown source'), { target: { value: 'fresh' } })
    await waitFor(() => expect(screen.getByTestId('md').textContent).toBe('fresh'))
  })
})
