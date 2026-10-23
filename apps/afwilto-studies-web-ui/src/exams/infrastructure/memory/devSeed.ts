import type { ExamsSeed } from './InMemoryExamsAdapter'

// Offline dev data (no VITE_API_URL). The subject id is the studies devSeed's AWS subject.
const T = '2026-10-22T12:00:00.000Z'

/** 1x1 PNGs: stand-ins for the moto sign images of `examples/moto-images.json`. */
const PIXEL_RED = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

export const MEDIA_ENTRADA_PROHIBIDA = 'a1'.repeat(32)
export const MEDIA_CEDA_EL_PASO = 'b2'.repeat(32)

export const examsDevSeed: ExamsSeed = {
  exams: [
    {
      id: 'f0000000-0000-7000-8000-000000000001',
      subjectId: 'd0000000-0000-7000-8000-000000000001',
      name: 'SAA-C03',
      questionCount: 65,
      timeLimitMin: 130,
      passPercent: 72,
      questionTotal: 0,
      classifications: [],
      version: 1,
      createdAt: T,
      updatedAt: T,
    },
  ],
  media: {
    [MEDIA_ENTRADA_PROHIBIDA]: PIXEL_RED,
    [MEDIA_CEDA_EL_PASO]: PIXEL_RED,
  },
}
