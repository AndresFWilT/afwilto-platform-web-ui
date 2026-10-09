import { useEffect, useLayoutEffect, useRef } from 'react'
import { Annotation, EditorState, Transaction } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'

/** Marks transactions that sync a new `value` in from outside: never echoed to onChange. */
const External = Annotation.define<boolean>()

interface SourceEditorProps {
  value: string
  onChange: (value: string) => void
  /** Ctrl+S / Cmd+S inside the editor (AC-F7); the browser's save dialog is prevented. */
  onSave: () => void
}

/**
 * CodeMirror 6 in Markdown mode (fenced code highlighted through lazy
 * language-data grammars). The only module that imports CodeMirror, and only
 * the note editor imports it (Slice 09b §2.7).
 */
export function SourceEditor({ value, onChange, onSave }: SourceEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const callbacks = useRef({ onChange, onSave })
  callbacks.current = { onChange, onSave }

  useEffect(() => {
    const save = () => {
      callbacks.current.onSave()
      return true
    }
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([
            { key: 'Mod-s', run: save, preventDefault: true },
            { key: 'Ctrl-s', run: save, preventDefault: true },
            { key: 'Meta-s', run: save, preventDefault: true },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          oneDark,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': 'Markdown source' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.some((t) => t.annotation(External))) {
              callbacks.current.onChange(update.state.doc.toString())
            }
          }),
        ],
      }),
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
    // The view is created once; later values arrive through the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Layout effect: the sync lands before any later user transaction can run on a stale doc.
  useLayoutEffect(() => {
    const editor = view.current
    if (editor && value !== editor.state.doc.toString()) {
      const head = Math.min(editor.state.selection.main.head, value.length)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
        selection: { anchor: head },
        // Not undoable: "Reload latest" must not be undone back into discarded text.
        annotations: [External.of(true), Transaction.addToHistory.of(false)],
      })
    }
  }, [value])

  return <div ref={host} className="min-h-[24rem] overflow-hidden rounded-lg border border-surface-border text-sm [&_.cm-editor]:min-h-[24rem]" />
}
