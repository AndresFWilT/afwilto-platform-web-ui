/**
 * Spec 14 §7 test 1 — pure merge-patch builder.
 * BR-PATCH1/2/3, BR-EV1-CLIENT, BR-EVT1. AC-1..AC-8.
 */
import { describe, it, expect } from 'vitest'
import { buildUpdatePatch } from '../src/pages/Form/buildUpdatePatch'
import { defaultValues, type FormValues } from '../src/pages/Form/CertificationForm'
import { InMemoryCertificationAdapter } from '../src/infrastructure/adapters/memory/InMemoryCertificationAdapter'

function values(overrides?: Partial<FormValues>): FormValues {
  return defaultValues({
    name: 'AWS SAA',
    status: 'planned',
    categoryPath: 'TI / Cloud',
    studyStartDate: '2026-01-01',
    expectedExamDate: '2026-06-01',
    notes: 'why',
    ...overrides,
  })
}

describe('buildUpdatePatch — BR-PATCH1: only changed fields', () => {
  it('returns an empty patch when nothing changed', () => {
    const initial = values()
    expect(buildUpdatePatch(initial, { ...initial })).toEqual({})
  })

  it('AC-1: changing only the exam date yields exactly that key', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, expectedExamDate: '2027-03-01' })
    expect(patch).toEqual({ expectedExamDate: '2027-03-01' })
  })

  it('AC-2: unchanged fields are absent, never null', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, name: 'AWS SAA v2' })
    expect(Object.keys(patch)).toEqual(['name'])
    expect('evidenceUrl' in patch).toBe(false)
    expect('achievedDate' in patch).toBe(false)
    expect('categoryPath' in patch).toBe(false)
    expect('status' in patch).toBe(false)
    expect('notes' in patch).toBe(false)
  })
})

describe('buildUpdatePatch — BR-PATCH2: clear vs unchanged', () => {
  it('AC-3: emptied nullable fields are sent as null', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, notes: '', studyStartDate: '' })
    expect(patch).toEqual({ notes: null, studyStartDate: null })
  })

  it('AC-4: a whitespace-only text edit is not sent', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, name: '  AWS SAA  ', notes: ' why ' })
    expect(patch).toEqual({})
  })

  it('trims the value it does send', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, name: '  CKA  ' })
    expect(patch).toEqual({ name: 'CKA' })
  })

  it('sends a changed category as a trimmed value', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, categoryPath: ' TI / Kubernetes ' })
    expect(patch).toEqual({ categoryPath: 'TI / Kubernetes' })
  })
})

describe('buildUpdatePatch — BR-PATCH3: name and status are never null', () => {
  it('omits an emptied name rather than clearing it', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, name: '   ' })
    expect('name' in patch).toBe(false)
  })

  it('omits an emptied category rather than clearing it (BR-CAT1)', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, categoryPath: '   ' })
    expect('categoryPath' in patch).toBe(false)
  })

  it('sends a changed status with a value', () => {
    const initial = values()
    const patch = buildUpdatePatch(initial, { ...initial, status: 'in_progress' })
    expect(patch).toEqual({ status: 'in_progress' })
  })
})

describe('buildUpdatePatch — BR-EV1-CLIENT: evidence only while achieved', () => {
  it('AC-6: leaving achieved sends only status, keeping evidence as history (BR-EV2)', () => {
    const initial = values({
      status: 'achieved',
      achievedDate: '2026-05-01',
      evidenceUrl: 'https://credly.com/a',
    })
    const patch = buildUpdatePatch(initial, { ...initial, status: 'planned' }, 'credly')
    expect(patch).toEqual({ status: 'planned' })
  })

  it('never emits evidence keys for a status that is not achieved', () => {
    const initial = values({ status: 'planned' })
    const patch = buildUpdatePatch(
      initial,
      { ...initial, achievedDate: '2026-09-20', evidenceUrl: 'https://credly.com/x' },
    )
    expect(patch).toEqual({})
  })

  it('AC-5: changing the evidence URL on an achieved certification is sent', () => {
    const initial = values({ status: 'achieved', evidenceUrl: 'https://credly.com/a' })
    const patch = buildUpdatePatch(
      initial,
      { ...initial, evidenceUrl: 'https://credly.com/b' },
      'credly',
    )
    expect(patch).toEqual({ evidenceUrl: 'https://credly.com/b', evidenceUrlTarget: 'credly' })
  })

  it('AC-5: clearing the evidence URL on an achieved certification sends null', () => {
    const initial = values({ status: 'achieved', evidenceUrl: 'https://credly.com/a' })
    const patch = buildUpdatePatch(initial, { ...initial, evidenceUrl: '' }, 'credly')
    expect(patch).toEqual({ evidenceUrl: null, evidenceUrlTarget: 'credly' })
  })

  it('clearing the achieved date on an achieved certification sends null', () => {
    const initial = values({ status: 'achieved', achievedDate: '2026-05-01' })
    const patch = buildUpdatePatch(initial, { ...initial, achievedDate: '' })
    expect(patch).toEqual({ achievedDate: null })
  })

  it('AC-7: achieve-and-fill in a single patch', () => {
    const initial = values({ status: 'planned' })
    const patch = buildUpdatePatch(initial, {
      ...initial,
      status: 'achieved',
      achievedDate: '2026-09-20',
      evidenceUrl: 'https://credly.com/x',
    })
    expect(patch).toEqual({
      status: 'achieved',
      achievedDate: '2026-09-20',
      evidenceUrl: 'https://credly.com/x',
      evidenceUrlTarget: 'credly',
    })
  })
})

describe('buildUpdatePatch — BR-EVT1: evidence write target', () => {
  it('AC-8: targets officialUrl when the evidence was read from officialUrl', () => {
    const initial = values({ status: 'achieved', evidenceUrl: 'https://aws.amazon.com/a' })
    const patch = buildUpdatePatch(
      initial,
      { ...initial, evidenceUrl: 'https://aws.amazon.com/b' },
      'official',
    )
    expect(patch).toEqual({
      evidenceUrl: 'https://aws.amazon.com/b',
      evidenceUrlTarget: 'official',
    })
  })

  it('AC-8: defaults the target to credly when there is no stored evidence', () => {
    const initial = values({ status: 'achieved' })
    const patch = buildUpdatePatch(initial, { ...initial, evidenceUrl: 'https://credly.com/x' })
    expect(patch.evidenceUrlTarget).toBe('credly')
  })

  it('AC-12: the pre-fix full snapshot is rejected where the merge-patch is accepted', async () => {
    const adapter = new InMemoryCertificationAdapter()
    await adapter.createCategory({ path: 'DevOps', color: '#22D3EE' })
    const cert = await adapter.create({
      name: 'CKA Kubernetes',
      status: 'planned',
      categoryPath: 'DevOps',
      studyStartDate: '2026-03-01',
      expectedExamDate: '2026-06-01',
    })

    // What buildUpdatePatch produced before Spec 14: every field, empties as null.
    const preFixSnapshot = {
      name: 'CKA Kubernetes',
      status: 'planned' as const,
      categoryPath: 'DevOps',
      studyStartDate: '2026-03-01',
      expectedExamDate: '2027-03-01',
      achievedDate: null,
      evidenceUrl: null,
      notes: null,
    }
    await expect(adapter.update(cert.id, preFixSnapshot)).rejects.toThrow(
      'credlyUrl is writable only when the certification is achieved'
    )

    const initial = values({ notes: '' })
    const patch = buildUpdatePatch(initial, { ...initial, expectedExamDate: '2027-03-01' })
    const updated = await adapter.update(cert.id, patch)
    expect(updated.expectedExamDate).toBe('2027-03-01')
  })

  it('does not attach a target when evidenceUrl is not part of the patch', () => {
    const initial = values({ status: 'achieved', evidenceUrl: 'https://credly.com/a' })
    const patch = buildUpdatePatch(initial, { ...initial, name: 'CKA' }, 'credly')
    expect(patch).toEqual({ name: 'CKA' })
    expect('evidenceUrlTarget' in patch).toBe(false)
  })
})
