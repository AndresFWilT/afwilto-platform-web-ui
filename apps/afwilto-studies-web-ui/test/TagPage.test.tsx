import { describe, it, expect } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { currentLocation, noteTitles, renderAt } from './support/renderStudies'
import { IDS } from './fixtures'

describe('TagPage (S07-10, D-2)', () => {
  it('lists notes from several subjects with subject name and category path', async () => {
    renderAt('/studies/tags/iam')
    expect(await screen.findByRole('heading', { level: 1, name: /iam/ })).toBeTruthy()
    await waitFor(() => expect(noteTitles()).toEqual(['Compute', 'Entra ID']))

    const compute = screen.getByRole('link', { name: 'Compute' }).closest('li')!
    expect(within(compute).getByText('AWS Certified Cloud Practitioner')).toBeTruthy()
    expect(within(compute).getByText('TI / Cloud / AWS')).toBeTruthy()
    expect(within(compute).getByTestId(`color-chip-${IDS.aws}`).style.backgroundColor).toBe('rgb(255, 153, 0)')

    const entra = screen.getByRole('link', { name: 'Entra ID' }).closest('li')!
    expect(within(entra).getByText('Azure')).toBeTruthy()
    expect(within(entra).getByText('TI / Cloud')).toBeTruthy()
  })

  it('applies the sort from the URL', async () => {
    renderAt('/studies/tags/iam?sort=title&order=desc')
    await waitFor(() => expect(noteTitles()).toEqual(['Entra ID', 'Compute']))
    expect(currentLocation()).toBe('/studies/tags/iam?sort=title&order=desc')
  })

  it('shows an empty state for an unknown tag', async () => {
    renderAt('/studies/tags/unknown')
    expect(await screen.findByText('No notes tagged “unknown”')).toBeTruthy()
  })

  it('shows an Alert with the API message for an invalid tag', async () => {
    renderAt('/studies/tags/bad_tag!')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('tag must be lowercase kebab-case, 1–40 characters')
  })
})
