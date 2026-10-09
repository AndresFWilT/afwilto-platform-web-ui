import type { StudiesSeed } from './InMemoryStudiesAdapter'

// Offline dev data (no VITE_API_URL): the parent spec §1.1 example.
const T = '2026-10-01T12:00:00.000Z'

export const devSeed: StudiesSeed = {
  categories: [
    { id: 'c0000000-0000-7000-8000-000000000001', parentId: null, name: 'TI', color: '#3B82F6' },
    { id: 'c0000000-0000-7000-8000-000000000002', parentId: 'c0000000-0000-7000-8000-000000000001', name: 'Cloud', color: '#22D3EE' },
    { id: 'c0000000-0000-7000-8000-000000000003', parentId: 'c0000000-0000-7000-8000-000000000002', name: 'AWS', color: '#FF9900' },
  ],
  kinds: [
    { id: 'b0000000-0000-7000-8000-000000000001', name: 'Summary' },
    { id: 'b0000000-0000-7000-8000-000000000002', name: 'Cheat sheet' },
  ],
  subjects: [
    {
      id: 'd0000000-0000-7000-8000-000000000001',
      categoryId: 'c0000000-0000-7000-8000-000000000003',
      name: 'AWS Certified Cloud Practitioner',
      description: 'Foundational AWS certification.',
      createdAt: T,
      updatedAt: T,
    },
  ],
  notes: [
    {
      id: 'e0000000-0000-7000-8000-000000000001',
      subjectId: 'd0000000-0000-7000-8000-000000000001',
      title: 'Storage',
      kindId: 'b0000000-0000-7000-8000-000000000001',
      tags: ['s3', 'storage'],
      content: '# Storage\n\n- S3: object storage\n- EBS: block storage\n- EFS: file storage',
      slabLinks: [],
      createdAt: T,
      updatedAt: T,
      version: 1,
    },
  ],
}
