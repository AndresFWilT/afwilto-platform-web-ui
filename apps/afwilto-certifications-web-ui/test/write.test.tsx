/**
 * Write-path integration tests (Slice 07 app).
 * All tests are red until the implementation is in place.
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

// The category field is a <Select> populated asynchronously from
// listCategories(); selecting a path requires waiting for its <option> to
// exist first (unlike the old free-text field, which took typed values
// immediately with no backing list).
async function selectCategory(path: string) {
  await screen.findByRole('option', { name: path })
  fireEvent.change(screen.getByLabelText(/category/i), { target: { value: path } })
}

// ── AC-1/AC-3: Create form ────────────────────────────────────────────────────

describe('CertificationFormPage (create)', () => {
  it('AC-1: renders Name, Status, Category, Study start, Expected exam, Notes fields', async () => {
    renderAt('/certifications/new')
    expect(await screen.findByLabelText(/name/i)).toBeTruthy()
    expect(screen.getByLabelText(/status/i)).toBeTruthy()
    expect(screen.getByLabelText(/category/i)).toBeTruthy()
    expect(screen.getByLabelText(/study start/i)).toBeTruthy()
    expect(screen.getByLabelText(/expected exam/i)).toBeTruthy()
    expect(screen.getByLabelText(/notes/i)).toBeTruthy()
  })

  it('AC-6: Achieved date field hidden by default; visible when status = achieved', async () => {
    renderAt('/certifications/new')
    await screen.findByLabelText(/name/i)
    expect(screen.queryByLabelText(/achieved date/i)).toBeNull()

    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'achieved' } })
    expect(screen.getByLabelText(/achieved date/i)).toBeTruthy()
  })

  it('AC-3: empty name shows required error and does not call create', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)
    await screen.findByLabelText(/name/i)

    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      // Name and Category are both required (Spec 14 BR-CAT1), so both alert.
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
      expect(screen.getByText(/name is required/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('AC-3: expected exam date before study start shows date error, no submit', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)
    await screen.findByLabelText(/name/i)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'AWS SAA' } })
    fireEvent.change(screen.getByLabelText(/study start/i), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText(/expected exam/i), { target: { value: '2026-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/on or after/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('AC-7: valid create shows success toast and returns to the journey list', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'TI / Cloud', color: '#22D3EE' }])
    renderAt('/certifications/new', adapter)
    await screen.findByLabelText(/name/i)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'AWS Solutions Architect' } })
    await selectCategory('TI / Cloud')
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/Certification created/i)).toBeTruthy()
    })
    expect((await adapter.list()).meta.totalItems).toBe(1)

    // Returns to the journey (list), not the detail page: the list heading and
    // the new row are shown.
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Certifications' })).toBeTruthy()
    })
    expect((await screen.findAllByText('AWS Solutions Architect')).length).toBeGreaterThan(0)
  })

  it('AC-5: service error on create shows error toast', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'TI / Cloud', color: '#22D3EE' }])
    vi.spyOn(adapter, 'create').mockRejectedValue(new Error('name already exists'))
    renderAt('/certifications/new', adapter)
    await screen.findByLabelText(/name/i)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'X' } })
    await selectCategory('TI / Cloud')
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/name already exists/i)).toBeTruthy()
    })
    // Stays on the create page
    expect(screen.getByRole('button', { name: /create/i })).toBeTruthy()
  })
})

// ── AC-2: Edit form ───────────────────────────────────────────────────────────

describe('CertificationEditPage', () => {
  let adapter: InMemoryCertificationAdapter

  beforeEach(async () => {
    adapter = new InMemoryCertificationAdapter([], [{ path: 'DevOps', color: '#22D3EE' }])
    await adapter.create({
      name: 'CKA Kubernetes',
      status: 'in_progress',
      categoryPath: 'DevOps',
      studyStartDate: '2026-03-01',
      notes: 'Important cert',
    })
  })

  it('AC-2: pre-fills form with existing cert data', async () => {
    const { id } = (await adapter.list()).items[0]
    renderAt(`/certifications/${id}/edit`, adapter)

    const nameInput = await screen.findByLabelText(/name/i) as HTMLInputElement
    expect(nameInput.value).toBe('CKA Kubernetes')

    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement
    expect(statusSelect.value).toBe('in_progress')
  })

  it('AC-2: valid edit calls update, shows toast, navigates to detail', async () => {
    const { id } = (await adapter.list()).items[0]
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${id}/edit`, adapter)

    const nameInput = await screen.findByLabelText(/name/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'CKA Kubernetes v2' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/Certification updated/i)).toBeTruthy()
    })
    expect(updateSpy).toHaveBeenCalledWith(id, expect.objectContaining({ name: 'CKA Kubernetes v2' }))
  })

  it('AC-5: edit service error shows error toast', async () => {
    const { id } = (await adapter.list()).items[0]
    vi.spyOn(adapter, 'update').mockRejectedValue(new Error('update failed'))
    renderAt(`/certifications/${id}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/update failed/i)).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: /save/i })).toBeTruthy()
  })
})

// ── Spec 14: the edit form submits a real merge-patch ────────────────────────

describe('CertificationEditPage — merge-patch (Spec 14)', () => {
  let adapter: InMemoryCertificationAdapter
  let certId: string

  beforeEach(async () => {
    adapter = new InMemoryCertificationAdapter([], [{ path: 'DevOps', color: '#22D3EE' }])
    const cert = await adapter.create({
      name: 'CKA Kubernetes',
      status: 'planned',
      categoryPath: 'DevOps',
      studyStartDate: '2026-03-01',
      expectedExamDate: '2026-06-01',
      notes: 'Important cert',
    })
    certId = cert.id
  })

  it('AC-1: changing only the exam date on a planned cert saves (no BR-EV1 violation)', async () => {
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${certId}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/expected exam/i), { target: { value: '2027-03-01' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/Certification updated/i)).toBeTruthy()
    })
    expect(updateSpy).toHaveBeenCalledWith(certId, { expectedExamDate: '2027-03-01' })
    expect((await adapter.getById(certId))?.expectedExamDate).toBe('2027-03-01')
  })

  it('AC-2: an untouched field is never sent as null', async () => {
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${certId}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'CKA v2' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    const [, patch] = updateSpy.mock.calls[0]
    expect(patch).toEqual({ name: 'CKA v2' })
  })

  it('AC-6: moving away from achieved sends only status and keeps evidence (BR-EV2)', async () => {
    await adapter.update(certId, {
      status: 'achieved',
      achievedDate: '2026-05-01',
      evidenceUrl: 'https://credly.com/x',
    })
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${certId}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'planned' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    expect(updateSpy).toHaveBeenCalledWith(certId, { status: 'planned' })

    const after = await adapter.getById(certId)
    expect(after?.status).toBe('planned')
    expect(after?.evidenceUrl).toBe('https://credly.com/x')
    expect(after?.achievedDate).toBe('2026-05-01')
  })

  it('AC-7: achieving and filling evidence in one save', async () => {
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${certId}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'achieved' } })
    fireEvent.change(screen.getByLabelText(/achieved date/i), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: 'https://credly.com/x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    expect(updateSpy).toHaveBeenCalledWith(certId, {
      status: 'achieved',
      achievedDate: '2026-09-20',
      evidenceUrl: 'https://credly.com/x',
      evidenceUrlTarget: 'credly',
    })
  })

  it('AC-9: an emptied category blocks the save', async () => {
    const updateSpy = vi.spyOn(adapter, 'update')
    renderAt(`/certifications/${certId}/edit`, adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeTruthy()
    })
    expect(updateSpy).not.toHaveBeenCalled()
  })
})

describe('CertificationFormPage — required category and evidence URL (Spec 14)', () => {
  it('AC-9: an empty category blocks create with its own message', async () => {
    const adapter = new InMemoryCertificationAdapter()
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Terraform' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('AC-13: a non-https evidence URL blocks the submit (the backend requires https)', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'DevOps', color: '#22D3EE' }])
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'CKA' } })
    await selectCategory('DevOps')
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'achieved' } })
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: 'http://credly.com/x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/must be an https url/i)).toBeTruthy()
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('AC-13: an https evidence URL passes validation', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'DevOps', color: '#22D3EE' }])
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'CKA' } })
    await selectCategory('DevOps')
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'achieved' } })
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: 'https://credly.com/x' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(createSpy).toHaveBeenCalled())
  })
})

describe('CertificationFormPage — evidence is dropped while not achieved (Spec 14 AC-10)', () => {
  it('AC-10: evidence typed as achieved is not sent after switching back to in_progress', async () => {
    const adapter = new InMemoryCertificationAdapter([], [{ path: 'DevOps', color: '#22D3EE' }])
    const createSpy = vi.spyOn(adapter, 'create')
    renderAt('/certifications/new', adapter)

    await screen.findByLabelText(/name/i)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Terraform Associate' } })
    await selectCategory('DevOps')
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'achieved' } })
    fireEvent.change(screen.getByLabelText(/achieved date/i), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText(/evidence url/i), {
      target: { value: 'https://credly.com/x' },
    })
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'in_progress' } })
    fireEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(createSpy).toHaveBeenCalled())
    const [cmd] = createSpy.mock.calls[0]
    expect(cmd.status).toBe('in_progress')
    expect(cmd.achievedDate).toBeUndefined()
    expect(cmd.evidenceUrl).toBeUndefined()
  })
})

// ── AC-4: Delete flow ─────────────────────────────────────────────────────────

describe('Delete flow (CertificationDetailPage)', () => {
  let adapter: InMemoryCertificationAdapter
  let certId: string

  beforeEach(async () => {
    adapter = new InMemoryCertificationAdapter()
    const cert = await adapter.create({ name: 'To Be Deleted' })
    certId = cert.id
  })

  it('AC-4: delete button opens confirm dialog', async () => {
    renderAt(`/certifications/${certId}`, adapter)
    await screen.findByText('To Be Deleted')

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
  })

  it('AC-4: dialog cancel closes without calling remove', async () => {
    const removeSpy = vi.spyOn(adapter, 'remove')
    renderAt(`/certifications/${certId}`, adapter)
    await screen.findByText('To Be Deleted')

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByRole('dialog')

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('AC-4: dialog confirm calls remove, shows toast, navigates to list', async () => {
    const removeSpy = vi.spyOn(adapter, 'remove')
    renderAt(`/certifications/${certId}`, adapter)
    await screen.findByText('To Be Deleted')

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    await screen.findByRole('dialog')

    // Click the destructive delete button in the dialog footer
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
    const dialogDeleteBtn = deleteButtons[deleteButtons.length - 1]
    fireEvent.click(dialogDeleteBtn)

    await waitFor(() => {
      expect(screen.getByText(/Certification deleted/i)).toBeTruthy()
    })
    expect(removeSpy).toHaveBeenCalledWith(certId)

    // After delete, the list page is shown
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Certifications' })).toBeTruthy()
    })
  })
})
