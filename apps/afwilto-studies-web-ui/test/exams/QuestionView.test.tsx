import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { QuestionView, type QuestionViewProps } from '../../src/shared/ui/organisms/QuestionView'
import { toggleSelection, type ViewQuestion } from '../../src/exams/domain'
import { multi2, resolveMedia, SIGN_SHA, STOP_SHA, t1, t1Reveal, t2, t3, YIELD_SHA } from './questionFixtures'

/** Holds the selection the way a runner page does, through the domain rule. */
function Harness({ question, initial = [], ...rest }: { question: ViewQuestion; initial?: string[] } & Partial<QuestionViewProps>) {
  const [selected, setSelected] = useState(initial)
  return (
    <QuestionView
      question={question}
      selected={selected}
      onToggle={(label) => setSelected((s) => toggleSelection(question, s, label))}
      resolveMediaUrl={resolveMedia}
      {...rest}
    />
  )
}

const items = () => [...document.querySelectorAll<HTMLElement>('[role=radio], [role=checkbox]')]
const checked = () => items().filter((i) => i.getAttribute('aria-checked') === 'true').map((i) => i.textContent)
const item = (letter: string) => items().find((i) => i.textContent?.startsWith(letter))!
const template = (container: HTMLElement) => container.querySelector('[data-template]')?.getAttribute('data-template')

describe('QuestionView — templates (AC-22)', () => {
  it('T1 text-list: a text stem with text options, one row per option with its letter', () => {
    const { container } = render(<Harness question={t1} />)
    expect(template(container)).toBe('text-list')
    expect(items().map((i) => i.textContent)).toEqual([
      expect.stringMatching(/^AStore an IAM user/),
      expect.stringMatching(/^BAttach an IAM role/),
      expect.stringMatching(/^CMake the bucket public/),
    ])
    expect(screen.getByText('without storing long-term credentials').tagName).toBe('STRONG')
    expect(container.querySelector('img')).toBeNull()
  })

  it('T2 media-stem: the stem image sits in a media frame, resolved through the resolver, beside the options', () => {
    const { container } = render(<Harness question={t2} />)
    expect(template(container)).toBe('media-stem')
    const img = screen.getByAltText('Disco rojo con una barra horizontal blanca')
    expect(img.getAttribute('src')).toBe(`/media/${SIGN_SHA}`)
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(screen.getByText('¿Qué indica esta señal?')).toBeTruthy()
    expect(items()).toHaveLength(3)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('T3 option-cards: image options become cards with their alt, and the text-only option is a card too', () => {
    const { container } = render(<Harness question={t3} />)
    expect(template(container)).toBe('option-cards')
    expect(screen.getByAltText('Triángulo invertido blanco con borde rojo').getAttribute('src')).toBe(`/media/${YIELD_SHA}`)
    expect(screen.getByAltText('Octágono rojo con la palabra STOP').getAttribute('src')).toBe(`/media/${STOP_SHA}`)
    expect(items()).toHaveLength(3)
    expect(item('C').textContent).toContain('Ninguna de las anteriores')
    expect(item('C').querySelector('img')).toBeNull()
  })
})

describe('QuestionView — selection (S07-4, AC-23)', () => {
  it('a single question is a radiogroup of radios; clicking B then C leaves only C checked', () => {
    render(<Harness question={t1} />)
    expect(screen.getByRole('radiogroup')).toBeTruthy()
    fireEvent.click(item('B'))
    expect(checked()).toEqual([item('B').textContent])
    fireEvent.click(item('C'))
    expect(checked()).toEqual([item('C').textContent])
  })

  it('pressing 2 selects B', () => {
    render(<Harness question={t1} />)
    fireEvent.keyDown(item('A'), { key: '2' })
    expect(checked()).toEqual([item('B').textContent])
  })

  it('1-6 act on the option in that position and ignore a position the question lacks', () => {
    render(<Harness question={t1} />)
    fireEvent.keyDown(item('A'), { key: '3' })
    expect(checked()).toEqual([item('C').textContent])
    fireEvent.keyDown(item('A'), { key: '4' })
    fireEvent.keyDown(item('A'), { key: '6' })
    expect(checked()).toEqual([item('C').textContent])
  })

  it('6 selects the sixth option and 7 and 0 do nothing', () => {
    const six: ViewQuestion = {
      type: 'single',
      chooseCount: 1,
      stem: 'Six options',
      options: ['A', 'B', 'C', 'D', 'E', 'F'].map((label) => ({ label, text: `Option ${label}` })),
    }
    render(<Harness question={six} />)
    fireEvent.keyDown(item('A'), { key: '7' })
    fireEvent.keyDown(item('A'), { key: '0' })
    expect(checked()).toEqual([])
    fireEvent.keyDown(item('A'), { key: '6' })
    expect(checked()).toEqual([item('F').textContent])
  })

  it('Space on a focused option selects it', () => {
    render(<Harness question={t1} />)
    fireEvent.keyDown(item('B'), { key: ' ' })
    expect(checked()).toEqual([item('B').textContent])
  })

  it('does not handle F, arrows, Enter or modified digits: they belong to the runner', () => {
    const onToggle = vi.fn()
    render(<QuestionView question={t1} selected={[]} onToggle={onToggle} resolveMediaUrl={resolveMedia} />)
    for (const init of [{ key: 'f' }, { key: 'F' }, { key: 'ArrowLeft' }, { key: 'ArrowRight' }, { key: 'Enter' }, { key: '1', ctrlKey: true }, { key: '1', metaKey: true }]) {
      fireEvent.keyDown(item('A'), init)
    }
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('a multi question is a group of checkboxes that shows "Choose 2" and a k/N counter', () => {
    render(<Harness question={multi2} />)
    expect(screen.getByRole('group')).toBeTruthy()
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
    expect(screen.getByText('Choose 2')).toBeTruthy()
    expect(screen.getByText('0/2')).toBeTruthy()
    fireEvent.click(item('A'))
    expect(screen.getByText('1/2')).toBeTruthy()
  })

  it('a single question shows no "Choose" badge', () => {
    render(<Harness question={t1} />)
    expect(screen.queryByText(/^Choose/)).toBeNull()
  })

  it('with 2/2 selected the other options are aria-disabled and ignore clicks and keys, including 3', () => {
    render(<Harness question={multi2} />)
    fireEvent.click(item('A'))
    fireEvent.click(item('B'))
    expect(screen.getByText('2/2')).toBeTruthy()
    expect(item('C').getAttribute('aria-disabled')).toBe('true')
    expect(item('D').getAttribute('aria-disabled')).toBe('true')
    expect(item('A').getAttribute('aria-disabled')).not.toBe('true')
    fireEvent.keyDown(item('C'), { key: '3' })
    fireEvent.click(item('D'))
    expect(checked()).toEqual([item('A').textContent, item('B').textContent])
  })

  it('deselecting one of the two re-enables the others', () => {
    render(<Harness question={multi2} />)
    fireEvent.click(item('A'))
    fireEvent.click(item('B'))
    fireEvent.click(item('A'))
    expect(item('C').getAttribute('aria-disabled')).not.toBe('true')
    fireEvent.keyDown(item('C'), { key: '3' })
    expect(checked()).toEqual([item('B').textContent, item('C').textContent])
  })
})

describe('QuestionView — disabled (S07-5)', () => {
  it('ignores clicks and keys and keeps the current selection visible', () => {
    render(<Harness question={t1} initial={['B']} disabled />)
    fireEvent.click(item('C'))
    fireEvent.keyDown(item('C'), { key: '3' })
    fireEvent.keyDown(item('C'), { key: ' ' })
    expect(checked()).toEqual([item('B').textContent])
    expect(items().every((i) => i.getAttribute('aria-disabled') === 'true')).toBe(true)
  })
})

describe('QuestionView — review marks (AC-24)', () => {
  it('marks the correct option ✓ with the text "Correct" and a wrong selection ✗ with "Your answer"', () => {
    render(<Harness question={t1} initial={['C']} disabled reveal={t1Reveal} />)
    expect(item('B').textContent).toContain('✓')
    expect(within(item('B')).getByText('Correct')).toBeTruthy()
    expect(item('C').textContent).toContain('✗')
    expect(within(item('C')).getByText('Your answer')).toBeTruthy()
    expect(item('A').textContent).not.toMatch(/[✓✗]/)
    expect(within(item('A')).queryByText(/Correct|Your answer/)).toBeNull()
  })

  it('a correct selection reads "Your answer" with ✓', () => {
    render(<Harness question={t1} initial={['B']} disabled reveal={t1Reveal} />)
    expect(item('B').textContent).toContain('✓')
    expect(within(item('B')).getByText('Your answer')).toBeTruthy()
    expect(within(item('B')).queryByText('Correct')).toBeNull()
  })

  it('shows each option rationale and then the explanation', () => {
    render(<Harness question={t1} initial={['C']} disabled reveal={t1Reveal} />)
    expect(screen.getByText('The role delivers temporary credentials that rotate automatically.')).toBeTruthy()
    expect(screen.getByText('User data is readable from the instance and the keys are long-term.')).toBeTruthy()
    const explanation = screen.getByText('Instance profiles give EC2 temporary credentials from STS.')
    const lastRationale = screen.getByText('A public bucket is not access control for a workload.')
    expect(lastRationale.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('exam mode (no reveal) shows only the selection: no marks, rationales or explanation', () => {
    render(<Harness question={t1} initial={['B']} />)
    expect(document.body.textContent).not.toMatch(/Correct|Your answer|[✓✗]|Explanation/)
    expect(checked()).toEqual([item('B').textContent])
  })

  it('the review marks work on cards too', () => {
    render(<Harness question={t3} initial={['B']} disabled reveal={{ correctLabels: ['A'], rationales: {} }} />)
    expect(within(item('A')).getByText('Correct')).toBeTruthy()
    expect(within(item('B')).getByText('Your answer')).toBeTruthy()
    expect(item('B').textContent).toContain('✗')
  })
})

describe('QuestionView — images (AC-25)', () => {
  it('a broken stem image renders its alt inside a bordered placeholder', () => {
    render(<Harness question={t2} />)
    fireEvent.error(screen.getByAltText('Disco rojo con una barra horizontal blanca'))
    const placeholder = screen.getByText('Disco rojo con una barra horizontal blanca')
    expect(placeholder.className).toContain('border')
    expect(document.querySelector('img')).toBeNull()
  })

  it('a broken option image renders its alt in the card', () => {
    render(<Harness question={t3} />)
    fireEvent.error(screen.getByAltText('Octágono rojo con la palabra STOP'))
    expect(within(item('B')).getByText('Octágono rojo con la palabra STOP').className).toContain('border')
  })

  it('an image the resolver cannot serve shows the placeholder without requesting anything', () => {
    render(<Harness question={t3} resolveMediaUrl={() => null} />)
    expect(document.querySelector('img')).toBeNull()
    expect(within(item('A')).getByText('Triángulo invertido blanco con borde rojo')).toBeTruthy()
  })

  it('the zoom button opens the image in a dialog and closing it removes the copy', () => {
    render(<Harness question={t2} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /enlarge/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByAltText('Disco rojo con una barra horizontal blanca').getAttribute('src')).toBe(`/media/${SIGN_SHA}`)
    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('clicking a card image selects the card instead of opening a zoom', () => {
    render(<Harness question={t3} />)
    expect(screen.queryByRole('button', { name: /enlarge/i })).toBeNull()
    fireEvent.click(screen.getByAltText('Octágono rojo con la palabra STOP'))
    expect(checked()).toEqual([item('B').textContent])
  })
})
