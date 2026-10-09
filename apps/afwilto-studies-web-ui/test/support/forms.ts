import { fireEvent, screen, within } from '@testing-library/react'

/** The open dialog with this accessible name (design-system Dialog → native <dialog>). */
export async function findDialog(name: string): Promise<HTMLElement> {
  return screen.findByRole('dialog', { name })
}

export function fill(scope: HTMLElement, label: string, value: string) {
  fireEvent.change(within(scope).getByLabelText(label), { target: { value } })
}

export function fieldValue(scope: HTMLElement, label: string): string {
  return (within(scope).getByLabelText(label) as HTMLInputElement).value
}

/** Picks a <select> option by its visible text. */
export function choose(scope: HTMLElement, label: string, optionText: string) {
  const select = within(scope).getByLabelText(label) as HTMLSelectElement
  const option = [...select.options].find((o) => o.textContent === optionText)
  if (!option) throw new Error(`no option "${optionText}" in ${label}: ${optionTexts(scope, label).join(', ')}`)
  fireEvent.change(select, { target: { value: option.value } })
}

export function optionTexts(scope: HTMLElement, label: string): string[] {
  const select = within(scope).getByLabelText(label) as HTMLSelectElement
  return [...select.options].map((o) => o.textContent ?? '')
}

export function selectedText(scope: HTMLElement, label: string): string {
  const select = within(scope).getByLabelText(label) as HTMLSelectElement
  return select.selectedOptions[0]?.textContent ?? ''
}

export function click(scope: HTMLElement, name: string) {
  fireEvent.click(within(scope).getByRole('button', { name }))
}

/** The error text tied to a control through aria-describedby (null when none). */
export function errorFor(scope: HTMLElement, label: string): string | null {
  const control = within(scope).getByLabelText(label)
  const id = control.getAttribute('aria-describedby')
  if (!id) return null
  return document.getElementById(id)?.textContent ?? null
}
