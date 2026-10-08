/**
 * Timeline page integration tests (Slice 08).
 * All tests are RED until TimelinePage is implemented.
 */
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

// ── AC-T8: Loading skeleton ─────────────────────────────────────────────────

describe('TimelinePage loading', () => {
  it('AC-T8: renders without crashing for the timeline route', async () => {
    const { adapter } = renderAt('/certifications/timeline')
    // page eventually renders (even if empty)
    expect(adapter).toBeTruthy()
    // heading or empty-state must eventually appear
    await waitFor(() => {
      const hasHeading = screen.queryAllByRole('heading').length > 0
      const hasStatus = screen.queryByText(/nothing planned|certifications/i) !== null
      expect(hasHeading || hasStatus).toBe(true)
    }, { timeout: 3000 })
  })
})

// ── AC-T5: Empty year ───────────────────────────────────────────────────────

describe('TimelinePage empty year', () => {
  it('AC-T5: shows empty state when no certs intersect the year', async () => {
    renderAt('/certifications/timeline?year=2030')
    await waitFor(() => {
      expect(screen.getByText(/nothing planned for 2030/i)).toBeTruthy()
    })
  })

  it('AC-T5: empty state has a "Plan a certification" link/button', async () => {
    renderAt('/certifications/timeline?year=2030')
    await waitFor(() => {
      expect(screen.getByText(/plan a certification/i)).toBeTruthy()
    })
  })
})

// ── AC-T1: Year filter ──────────────────────────────────────────────────────

describe('TimelinePage year filter', () => {
  it('AC-T1: shows cert whose dates intersect the selected year', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({
      name: 'AWS SAA',
      studyStartDate: '2026-08-01',
      expectedExamDate: '2026-11-15',
    })
    renderAt('/certifications/timeline?year=2026', adapter)
    await waitFor(() => {
      expect(screen.getByText('AWS SAA')).toBeTruthy()
    })
  })

  it('AC-T1: hides cert whose dates are entirely outside the year', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({ name: 'Old Cert', studyStartDate: '2024-01-01', expectedExamDate: '2024-12-31' })
    await adapter.create({ name: 'Current Cert', studyStartDate: '2026-03-01', expectedExamDate: '2026-07-31' })
    renderAt('/certifications/timeline?year=2026', adapter)
    await waitFor(() => {
      expect(screen.getByText('Current Cert')).toBeTruthy()
    })
    // "Old Cert" should not be on the canvas — may still appear in unscheduled tray
    // but it has dates so it shouldn't appear anywhere
    expect(screen.queryByText('Old Cert')).toBeNull()
  })
})

// ── AC-T4: Unscheduled tray ─────────────────────────────────────────────────

describe('TimelinePage unscheduled tray', () => {
  it('AC-T4: cert with no dates appears in Unscheduled tray, not on canvas', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.create({ name: 'Undated Idea' })
    renderAt('/certifications/timeline?year=2026', adapter)
    await waitFor(() => {
      expect(screen.getByText(/unscheduled/i)).toBeTruthy()
      expect(screen.getByText('Undated Idea')).toBeTruthy()
    })
  })
})

// ── AC-T3: Bar is a link ────────────────────────────────────────────────────

describe('TimelinePage bar navigation', () => {
  it('AC-T3: each timeline bar is a link to the detail page', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({
      name: 'CKA',
      studyStartDate: '2026-05-01',
      expectedExamDate: '2026-09-30',
    })
    renderAt('/certifications/timeline?year=2026', adapter)
    await waitFor(() => {
      expect(screen.getByText('CKA')).toBeTruthy()
    })
    // The bar or its container should be an anchor pointing to /certifications/:id
    const links = screen.getAllByRole('link')
    const certLink = links.find((l) => l.getAttribute('href')?.includes(cert.id))
    expect(certLink).toBeTruthy()
  })
})

// ── AC-T6: Year navigation ──────────────────────────────────────────────────

describe('TimelinePage year navigation', () => {
  it('AC-T6: prev-year button decrements the year', async () => {
    renderAt('/certifications/timeline?year=2026')
    await waitFor(() => {
      expect(screen.getByText('2026')).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: /previous year|◀|prev/i }))
    await waitFor(() => {
      expect(screen.getByText('2025')).toBeTruthy()
    })
  })

  it('AC-T6: next-year button increments the year', async () => {
    renderAt('/certifications/timeline?year=2026')
    await waitFor(() => {
      expect(screen.getByText('2026')).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: /next year|▶|next/i }))
    await waitFor(() => {
      expect(screen.getByText('2027')).toBeTruthy()
    })
  })
})

// ── AC-T8: Error state ──────────────────────────────────────────────────────

describe('TimelinePage error state', () => {
  it('AC-T8: shows error Alert when fetch fails', async () => {
    const adapter = new InMemoryCertificationAdapter()
    vi.spyOn(adapter, 'list').mockRejectedValue(new Error('Timeline service unavailable'))
    renderAt('/certifications/timeline?year=2026', adapter)
    await waitFor(() => {
      expect(screen.getByText(/timeline service unavailable/i)).toBeTruthy()
    })
  })
})
