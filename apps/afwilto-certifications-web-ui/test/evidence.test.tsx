/**
 * Evidence UI integration tests (Slice 09 app).
 * All tests are RED until the evidence section is implemented.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

// ── AC-EV1: Evidence section visibility ────────────────────────────────────

describe('Evidence section visibility', () => {
  it('AC-EV1: no evidence section for a planned cert', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'Planned Cert', status: 'planned' })
    renderAt(`/certifications/${cert.id}`, adapter)
    await screen.findByText('Planned Cert')
    expect(screen.queryByText(/evidence/i)).toBeNull()
  })

  // Spec 14 AC-6 makes "not achieved, but evidence kept as history" reachable
  // (BR-EV2), so the detail page must not present that history as current.
  it('AC-14: achieved date and evidence link are hidden once the cert is no longer achieved', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'Regressed Cert' })
    await adapter.update(cert.id, {
      status: 'achieved',
      achievedDate: '2026-05-01',
      evidenceUrl: 'https://credly.com/x',
    })
    await adapter.update(cert.id, { status: 'planned' })

    renderAt(`/certifications/${cert.id}`, adapter)
    await screen.findByText('Regressed Cert')

    expect(screen.queryByText('2026-05-01')).toBeNull()
    expect(screen.queryByText(/view evidence/i)).toBeNull()
  })

  it('AC-14: achieved date and evidence link are shown while achieved', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'Current Cert' })
    await adapter.update(cert.id, {
      status: 'achieved',
      achievedDate: '2026-05-01',
      evidenceUrl: 'https://credly.com/x',
    })

    renderAt(`/certifications/${cert.id}`, adapter)
    await screen.findByText('Current Cert')

    expect(screen.getByText('2026-05-01')).toBeTruthy()
    expect(screen.getByText(/view evidence/i)).toBeTruthy()
  })

  it('AC-EV1: evidence section visible for an achieved cert', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'Done Cert', status: 'achieved' })
    renderAt(`/certifications/${cert.id}`, adapter)
    await screen.findByText('Done Cert')
    await waitFor(() => {
      expect(screen.getByText(/evidence/i)).toBeTruthy()
    })
  })
})

// ── AC-EV2: Attachment list ─────────────────────────────────────────────────

describe('Attachment list', () => {
  let adapter: InMemoryCertificationAdapter
  let certId: string

  beforeEach(async () => {
    adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'AWS cert', status: 'achieved' })
    certId = cert.id
    // Seed an attachment in the adapter
    await adapter.uploadAttachment(certId, 'certificate', new File(['data'], 'cert.pdf', { type: 'application/pdf' }))
  })

  it('AC-EV2: shows filename and download link for existing attachment', async () => {
    renderAt(`/certifications/${certId}`, adapter)
    await waitFor(() => {
      expect(screen.getByText('cert.pdf')).toBeTruthy()
    })
    const link = screen.getByRole('link', { name: /cert\.pdf|download/i })
    expect(link.getAttribute('href')).toBeTruthy()
  })

  it('AC-EV2: shows upload button for missing diploma', async () => {
    renderAt(`/certifications/${certId}`, adapter)
    await waitFor(() => {
      expect(screen.getByText(/upload diploma|add diploma/i)).toBeTruthy()
    })
  })

  it('AC-EV4: remove button calls removeAttachment and hides attachment', async () => {
    const removeSpy = vi.spyOn(adapter, 'removeAttachment')
    renderAt(`/certifications/${certId}`, adapter)
    await screen.findByText('cert.pdf')

    const attachment = (await adapter.getById(certId))!.attachments[0]
    fireEvent.click(screen.getByRole('button', { name: /remove certificate|remove/i }))

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(attachment.id)
    })
    await waitFor(() => {
      expect(screen.queryByText('cert.pdf')).toBeNull()
    })
  })
})

// ── AC-EV3: Upload ──────────────────────────────────────────────────────────

describe('Upload', () => {
  it('AC-EV3: upload calls service and shows success toast', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'CKA', status: 'achieved' })
    const uploadSpy = vi.spyOn(adapter, 'uploadAttachment')
    renderAt(`/certifications/${cert.id}`, adapter)

    // Wait for evidence section
    await waitFor(() => expect(screen.getByText(/evidence/i)).toBeTruthy())

    // Find the certificate file input
    const fileInput = screen.getByTestId('upload-certificate') as HTMLInputElement
    const file = new File(['bytes'], 'certificate.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(cert.id, 'certificate', expect.any(File))
    })
    await waitFor(() => {
      expect(screen.getByText(/attachment uploaded|certificate uploaded|uploaded/i)).toBeTruthy()
    })
  })

  it('AC-EV3: upload error shows error toast', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'CKA', status: 'achieved' })
    vi.spyOn(adapter, 'uploadAttachment').mockRejectedValue(new Error('File too large'))
    renderAt(`/certifications/${cert.id}`, adapter)

    await waitFor(() => expect(screen.getByText(/evidence/i)).toBeTruthy())

    const fileInput = screen.getByTestId('upload-certificate') as HTMLInputElement
    const file = new File(['bytes'], 'big.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeTruthy()
    })
  })
})
