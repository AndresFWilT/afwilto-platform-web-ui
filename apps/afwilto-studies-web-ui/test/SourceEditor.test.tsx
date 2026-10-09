import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EditorView } from '@codemirror/view'
import { undo } from '@codemirror/commands'
import { SourceEditor } from '../src/features/editor/SourceEditor'

// S09b-11: the real CodeMirror 6 in jsdom, behind our thin wrapper.
function viewOf(container: HTMLElement): EditorView {
  const dom = container.querySelector('.cm-editor') as HTMLElement
  const view = EditorView.findFromDOM(dom)
  if (!view) throw new Error('no CodeMirror view')
  return view
}

describe('SourceEditor (S09b-11)', () => {
  it('renders the value in a labelled editor', () => {
    const { container } = render(<SourceEditor value={'# Title\n\nbody'} onChange={() => {}} onSave={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Markdown source' })).toBeTruthy()
    expect(viewOf(container).state.doc.toString()).toBe('# Title\n\nbody')
  })

  it('reports user edits through onChange', () => {
    const onChange = vi.fn()
    const { container } = render(<SourceEditor value="abc" onChange={onChange} onSave={() => {}} />)
    const view = viewOf(container)
    view.dispatch({ changes: { from: 3, insert: 'd' }, userEvent: 'input.type' })
    expect(onChange).toHaveBeenLastCalledWith('abcd')
  })

  it('Ctrl+S and Cmd+S both call onSave, and the browser default is prevented', () => {
    const onSave = vi.fn()
    const { container } = render(<SourceEditor value="abc" onChange={() => {}} onSave={onSave} />)
    const content = container.querySelector('.cm-content') as HTMLElement
    const ctrl = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true })
    const cmd = new KeyboardEvent('keydown', { key: 's', metaKey: true, bubbles: true, cancelable: true })
    content.dispatchEvent(ctrl)
    content.dispatchEvent(cmd)
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(ctrl.defaultPrevented && cmd.defaultPrevented).toBe(true)
  })

  it('an outside replace is not undoable and keeps the cursor where it can', async () => {
    const onChange = vi.fn()
    const { container, rerender } = render(<SourceEditor value="mine" onChange={onChange} onSave={() => {}} />)
    const view = viewOf(container)
    view.dispatch({ changes: { from: 4, insert: '!' }, selection: { anchor: 2 }, userEvent: 'input.type' })
    onChange.mockClear()
    rerender(<SourceEditor value="theirs, much longer" onChange={onChange} onSave={() => {}} />)
    await waitFor(() => expect(view.state.doc.toString()).toBe('theirs, much longer'))
    expect(view.state.selection.main.head).toBe(2)
    undo(view)
    expect(view.state.doc.toString()).toBe('theirs, much longer') // "Reload latest" cannot be undone into the discarded text
    expect(onChange).not.toHaveBeenCalled()
  })

  it('a new value from outside replaces the document without echoing onChange', async () => {
    const onChange = vi.fn()
    const { container, rerender } = render(<SourceEditor value="mine" onChange={onChange} onSave={() => {}} />)
    rerender(<SourceEditor value="theirs" onChange={onChange} onSave={() => {}} />)
    await waitFor(() => expect(viewOf(container).state.doc.toString()).toBe('theirs'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
