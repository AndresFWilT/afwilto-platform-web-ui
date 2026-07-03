import { useState } from 'react'
import { Card, Text, Button, FormField } from '@afwilto/design-system'

interface TrieWordInputProps {
  disabled: boolean
  onInsert: (word: string, translation: string) => void
  onDelete: (word: string) => void
}

export function TrieWordInput({ disabled, onInsert, onDelete }: TrieWordInputProps) {
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')

  const wordValid = /^[a-z]+$/.test(word)
  const wordError = word !== '' && !wordValid ? 'Only lowercase letters a-z' : undefined

  const handleInsert = () => {
    if (!wordValid || !translation.trim()) return
    onInsert(word, translation.trim())
    setWord('')
    setTranslation('')
  }

  const handleDelete = () => {
    if (!wordValid) return
    onDelete(word)
    setWord('')
    setTranslation('')
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text variant="h4" color="default">Dictionary Entry</Text>
        <Text variant="caption" color="muted">
          Words must be lowercase a–z only. Translation can be any text.
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          id="trie-word"
          label="Word"
          placeholder="e.g. hello"
          value={word}
          errorMessage={wordError}
          onChange={(e) => setWord(e.target.value.toLowerCase())}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleInsert()}
        />
        <FormField
          id="trie-translation"
          label="Translation"
          placeholder="e.g. hola"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleInsert()}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          disabled={disabled || !wordValid || !translation.trim()}
          onClick={handleInsert}
        >
          Insert
        </Button>
        <Button
          variant="danger"
          disabled={disabled || !wordValid}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </Card>
  )
}
