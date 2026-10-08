import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { App } from '../src/App'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'

function renderAt(url: string, adapter = new InMemoryCertificationAdapter()) {
  return {
    adapter,
    ...render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/certifications/*"
            element={<App value={{ certificationJourneyService: adapter }} />}
          />
        </Routes>
      </MemoryRouter>
    ),
  }
}

describe('CategoryFormPage', () => {
  it('renders Path and Color fields', async () => {
    renderAt('/certifications/categories/new')
    expect(await screen.findByLabelText(/path/i)).toBeTruthy()
    expect(screen.getByLabelText('Color')).toBeTruthy()
  })

  it('AC-4: an invalid hex color is blocked client-side, before any network call', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'createCategory')
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: 'Cloud / AWS' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: 'blue' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/color must be a 6-digit hex value/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('AC-4: a too-short hex (#ABC) is blocked client-side', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'createCategory')
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: 'Cloud / AWS' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#ABC' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/color must be a 6-digit hex value/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('an empty path is blocked client-side', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'createCategory')
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#22D3EE' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/path is required/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('submits the trimmed path and normalized (uppercase) color', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'createCategory')
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: '  Cloud / AWS  ' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#22d3ee' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({ path: 'Cloud / AWS', color: '#22D3EE' })
    )
  })

  it('AC-3: on success, returns to the certification create form with the new category pre-selected', async () => {
    renderAt('/certifications/categories/new')

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: 'Cloud / AWS' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#22D3EE' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await screen.findByLabelText(/name/i)
    await waitFor(() => {
      const categorySelect = screen.getByLabelText(/category/i) as HTMLSelectElement
      expect(categorySelect.value).toBe('Cloud / AWS')
    })
  })

  it('AC-5: a duplicate path shows the backend message via toast, the user stays on the form', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'Cloud / AWS', color: '#22D3EE' }])
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: 'Cloud / AWS' } })
    fireEvent.change(screen.getByLabelText('Color'), { target: { value: '#34D399' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/a category with this path already exists/i)).toBeTruthy()
    })
    expect(screen.getByLabelText(/path/i)).toBeTruthy()
  })

  it('cancel navigates back without creating anything', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'createCategory')
    renderAt('/certifications/categories/new', adapter)

    fireEvent.change(await screen.findByLabelText(/path/i), { target: { value: 'Cloud / AWS' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(createSpy).not.toHaveBeenCalled()
  })
})
