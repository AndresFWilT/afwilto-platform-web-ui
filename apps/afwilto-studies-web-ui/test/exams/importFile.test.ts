import { describe, it, expect } from 'vitest'
import { importFileProblem } from '../../src/exams/domain'

const MiB = 1024 * 1024

describe('importFileProblem (FR-4 limits)', () => {
  it.each([
    { name: 'preguntas.json', size: 1000 },
    { name: 'PREGUNTAS.JSON', size: 10 * MiB },
    { name: 'banco.zip', size: 50 * MiB },
    { name: 'banco.ZIP', size: 1 },
  ])('accepts $name of $size bytes', (file) => {
    expect(importFileProblem(file)).toBeNull()
  })

  it.each(['notas.txt', 'preguntas.json.bak', 'sin-extension', 'imagen.png'])('refuses %s: only .json or .zip', (name) => {
    expect(importFileProblem({ name, size: 10 })).toBe('Choose a .json or .zip file')
  })

  it('a .json over 10 MiB is refused, naming the limit', () => {
    expect(importFileProblem({ name: 'a.json', size: 10 * MiB + 1 })).toBe('A .json file can be up to 10 MiB')
  })

  it('a .zip over 50 MiB is refused, naming the limit', () => {
    expect(importFileProblem({ name: 'a.zip', size: 50 * MiB + 1 })).toBe('A .zip file can be up to 50 MiB')
  })

  it('an empty file is refused', () => {
    expect(importFileProblem({ name: 'a.json', size: 0 })).toBe('The file is empty')
  })
})
