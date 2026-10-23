import { describe, it, expect } from 'vitest'
import { toggleSelection } from '../../src/exams/domain'

const options = ['A', 'B', 'C', 'D'].map((label) => ({ label, text: label }))
const single = { type: 'single', chooseCount: 1, options } as const
const multi2 = { type: 'multi', chooseCount: 2, options } as const

describe('toggleSelection', () => {
  it('single: choosing another option replaces the selection', () => {
    expect(toggleSelection(single, ['B'], 'C')).toEqual(['C'])
  })

  it('single: choosing the selected option keeps it selected', () => {
    expect(toggleSelection(single, ['B'], 'B')).toEqual(['B'])
  })

  it('multi: adds up to chooseCount and returns labels in option order', () => {
    expect(toggleSelection(multi2, ['C'], 'A')).toEqual(['A', 'C'])
  })

  it('multi: a third option is ignored once chooseCount are selected', () => {
    expect(toggleSelection(multi2, ['A', 'C'], 'D')).toEqual(['A', 'C'])
  })

  it('multi: toggling a selected option deselects it', () => {
    expect(toggleSelection(multi2, ['A', 'C'], 'A')).toEqual(['C'])
  })

  it('ignores a label the question does not have', () => {
    expect(toggleSelection(multi2, ['A'], 'Z')).toEqual(['A'])
  })
})
