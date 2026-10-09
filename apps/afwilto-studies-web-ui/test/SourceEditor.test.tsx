import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('a click in the box outside the text focuses it with the cursor at the end', () => {
    const { container } = render(<SourceEditor value="abc" onChange={() => {}} onSave={() => {}} />)
    const box = container.firstElementChild as HTMLElement
    fireEvent.mouseDown(box)
    expect(document.activeElement).toBe(container.querySelector('.cm-content'))
    expect(viewOf(container).state.selection.main.head).toBe(3)
  })

  it('a click inside the text is left to CodeMirror (never forced to the end)', () => {
    const { container } = render(<SourceEditor value="abcdef" onChange={() => {}} onSave={() => {}} />)
    // CodeMirror places the cursor itself (in jsdom it lacks coordinates, so the
    // position is not observable); what matters is that our box handler stays out:
    // it is the only code path that calls view.focus().
    const focus = vi.spyOn(viewOf(container), 'focus')
    fireEvent.mouseDown(container.querySelector('.cm-line')!)
    expect(focus).not.toHaveBeenCalled()
    fireEvent.mouseDown(container.firstElementChild!)
    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('the editable area fills the box, so the empty box is clickable text area', () => {
    const { container } = render(<SourceEditor value="" onChange={() => {}} onSave={() => {}} />)
    const content = container.querySelector('.cm-content') as HTMLElement
    expect(getComputedStyle(content).minHeight).toBe('24rem')
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
