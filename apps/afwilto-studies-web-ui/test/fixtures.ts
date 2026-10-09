import type { StudiesSeed } from '../src/infrastructure/adapters/memory/InMemoryStudiesAdapter'

// Noon UTC keeps the rendered date identical in every viewer timezone.
export const D1 = '2026-01-01T12:00:00.000Z'
export const D2 = '2026-01-02T12:00:00.000Z'
export const D3 = '2026-01-03T12:00:00.000Z'

export const IDS = {
  ti: '00000000-0000-7000-8000-000000000001',
  cloud: '00000000-0000-7000-8000-000000000002',
  aws: '00000000-0000-7000-8000-000000000003',
  math: '00000000-0000-7000-8000-000000000004',
  ccp: '00000000-0000-7000-8000-000000000011',
  azure: '00000000-0000-7000-8000-000000000012',
  emptySubject: '00000000-0000-7000-8000-000000000013',
  compute: '00000000-0000-7000-8000-000000000021',
  networking: '00000000-0000-7000-8000-000000000022',
  storage: '00000000-0000-7000-8000-000000000023',
  entra: '00000000-0000-7000-8000-000000000024',
  summary: '00000000-0000-7000-8000-000000000031',
  cheat: '00000000-0000-7000-8000-000000000032',
  missing: '00000000-0000-7000-8000-0000000000ff',
}

/**
 * TI > Cloud > AWS, plus a root "Math". Subject "AWS Certified Cloud
 * Practitioner" (AWS) holds the parent AC-B16 sort fixture; "Azure" (Cloud)
 * holds one note so the tag view spans two subjects.
 */
export function librarySeed(): StudiesSeed {
  return {
    categories: [
      { id: IDS.aws, parentId: IDS.cloud, name: 'AWS', color: '#FF9900' },
      { id: IDS.math, parentId: null, name: 'Math', color: '#A78BFA' },
      { id: IDS.cloud, parentId: IDS.ti, name: 'Cloud', color: '#22D3EE' },
      { id: IDS.ti, parentId: null, name: 'TI', color: '#3B82F6' },
    ],
    kinds: [
      { id: IDS.summary, name: 'Summary' },
      { id: IDS.cheat, name: 'Cheat sheet' },
    ],
    subjects: [
      {
        id: IDS.ccp,
        categoryId: IDS.aws,
        name: 'AWS Certified Cloud Practitioner',
        description: 'Foundational AWS certification.',
        createdAt: D1,
        updatedAt: D1,
      },
      { id: IDS.azure, categoryId: IDS.cloud, name: 'Azure', description: null, createdAt: D1, updatedAt: D1 },
      { id: IDS.emptySubject, categoryId: IDS.math, name: 'Calculus', description: null, createdAt: D1, updatedAt: D1 },
    ],
    notes: [
      // parent AC-B16: Compute (c d1, u d3), Networking (c d3, u d1), Storage (c d2, u d2)
      {
        id: IDS.networking,
        subjectId: IDS.ccp,
        title: 'Networking',
        kindId: IDS.cheat,
        tags: ['vpc'],
        content: 'VPC basics',
        slabLinks: [],
        createdAt: D3,
        updatedAt: D1,
        version: 1,
      },
      {
        id: IDS.storage,
        subjectId: IDS.ccp,
        title: 'Storage',
        kindId: IDS.summary,
        tags: ['s3'],
        content: '# Storage\n\n$$E=mc^2$$',
        slabLinks: [],
        createdAt: D2,
        updatedAt: D2,
        version: 1,
      },
      {
        id: IDS.compute,
        subjectId: IDS.ccp,
        title: 'Compute',
        kindId: IDS.summary,
        tags: ['ec2', 'iam'],
        content: '<script>alert(1)</script>\nEC2 **instances**',
        slabLinks: [{ label: 'Round robin lab', path: '/slab/ud/operative-systems/round-robin' }],
        createdAt: D1,
        updatedAt: D3,
        version: 3,
      },
      {
        id: IDS.entra,
        subjectId: IDS.azure,
        title: 'Entra ID',
        kindId: IDS.summary,
        tags: ['cloud-security', 'iam'],
        content: '',
        slabLinks: [],
        createdAt: D2,
        updatedAt: D2,
        version: 1,
      },
    ],
  }
}

export const AC_B16_ORDERS: Array<{ label: string; sort: 'title' | 'createdAt' | 'updatedAt'; order: 'asc' | 'desc'; titles: string[] }> = [
  { label: 'A–Z', sort: 'title', order: 'asc', titles: ['Compute', 'Networking', 'Storage'] },
  { label: 'Z–A', sort: 'title', order: 'desc', titles: ['Storage', 'Networking', 'Compute'] },
  { label: 'Recently updated', sort: 'updatedAt', order: 'desc', titles: ['Compute', 'Storage', 'Networking'] },
  { label: 'Recently created', sort: 'createdAt', order: 'desc', titles: ['Networking', 'Storage', 'Compute'] },
  { label: 'Oldest first', sort: 'createdAt', order: 'asc', titles: ['Compute', 'Storage', 'Networking'] },
]

/**
 * Ties and case variation the AC-B16 fixture lacks: equal timestamps, titles
 * differing only in case across subjects (tie broken by id), and a root whose
 * name sorts between "TI" and its child under the backend's path key.
 */
export const TIE = {
  ti: '00000000-0000-7000-8000-0000000000a1',
  tiBang: '00000000-0000-7000-8000-0000000000a2',
  cloud: '00000000-0000-7000-8000-0000000000a3',
  s1: '00000000-0000-7000-8000-0000000000b1',
  s2: '00000000-0000-7000-8000-0000000000b2',
  appleUpper: '00000000-0000-7000-8000-0000000000c0',
  banana: '00000000-0000-7000-8000-0000000000c1',
  appleLower: '00000000-0000-7000-8000-0000000000c2',
}

export function tieSeed(): StudiesSeed {
  const note = (id: string, subjectId: string, title: string) => ({
    id, subjectId, title, kindId: IDS.summary, tags: ['dup'], content: '', slabLinks: [],
    createdAt: D1, updatedAt: D2, version: 1,
  })
  return {
    categories: [
      { id: TIE.tiBang, parentId: null, name: 'TI !', color: '#A78BFA' },
      { id: TIE.cloud, parentId: TIE.ti, name: 'Cloud', color: '#22D3EE' },
      { id: TIE.ti, parentId: null, name: 'TI', color: '#3B82F6' },
    ],
    kinds: [{ id: IDS.summary, name: 'Summary' }],
    subjects: [
      { id: TIE.s1, categoryId: TIE.ti, name: 'One', description: null, createdAt: D1, updatedAt: D1 },
      { id: TIE.s2, categoryId: TIE.tiBang, name: 'Two', description: null, createdAt: D1, updatedAt: D1 },
    ],
    notes: [note(TIE.banana, TIE.s1, 'Banana'), note(TIE.appleLower, TIE.s1, 'apple'), note(TIE.appleUpper, TIE.s2, 'Apple')],
  }
}
