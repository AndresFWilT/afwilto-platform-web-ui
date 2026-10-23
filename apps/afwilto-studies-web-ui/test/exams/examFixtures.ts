import type { Exam, ExamQuestion, ImportReport } from '../../src/exams/domain'
import type { ExamsSeed } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'

const T = '2026-10-22T12:00:00.000Z'

export const SUBJECT_ID = '00000000-0000-7000-8000-0000000000a1'
export const EXAM_ID = '00000000-0000-7000-8000-0000000000e1'

/** Stable ids so tests can name a category without reading the adapter. */
export const CLS = { dominio: 'c0000000-0000-7000-8000-000000000001', servicio: 'c0000000-0000-7000-8000-000000000002' }
export const CAT = {
  seguridad: 'a0000000-0000-7000-8000-000000000001',
  rendimiento: 'a0000000-0000-7000-8000-000000000002',
  costos: 'a0000000-0000-7000-8000-000000000003',
  s3: 'a0000000-0000-7000-8000-000000000011',
  storage: 'a0000000-0000-7000-8000-000000000012',
  vpc: 'a0000000-0000-7000-8000-000000000013',
}

const cat = (id: string, name: string, weightPercent: number | null) => ({
  id,
  key: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  weightPercent,
  paceQuestions: null,
  paceMinutes: null,
  questionCount: 0,
})

/** SAA-C03 with manual primary weights 40/40/20 (Dominio) and a secondary "Servicio". Counts are derived from the questions. */
export function examFixture(overrides: Partial<Exam> = {}): Exam {
  return {
    id: EXAM_ID,
    subjectId: SUBJECT_ID,
    name: 'SAA-C03',
    questionCount: 65,
    timeLimitMin: 130,
    passPercent: 72,
    questionTotal: 0,
    version: 1,
    createdAt: T,
    updatedAt: T,
    classifications: [
      {
        id: CLS.dominio,
        name: 'Dominio',
        position: 0,
        weightMode: 'manual',
        categories: [cat(CAT.seguridad, 'Seguridad', 40), cat(CAT.rendimiento, 'Rendimiento', 40), cat(CAT.costos, 'Costos', 20)],
      },
      {
        id: CLS.servicio,
        name: 'Servicio',
        position: 1,
        weightMode: 'manual',
        categories: [cat(CAT.s3, 'Amazon S3', null), cat(CAT.storage, 'Storage', null), cat(CAT.vpc, 'VPC', null)],
      },
    ],
    ...overrides,
  }
}

export function questionFixture(key: string, categories: Array<[string, string]> = [], overrides: Partial<ExamQuestion> = {}): ExamQuestion {
  return {
    id: `q-${key}`,
    examId: EXAM_ID,
    key,
    type: 'single',
    stem: `Pregunta ${key}: ¿cuál opción es correcta?`,
    categories: categories.map(([classification, name]) => ({ classification, name })),
    options: [
      { label: 'A', text: 'Opción A', correct: false, rationale: 'No: A es incorrecta.' },
      { label: 'B', text: 'Opción B', correct: true, rationale: 'Sí: B es correcta.' },
      { label: 'C', text: 'Opción C', correct: false },
    ],
    explanation: `Explicación de ${key}.`,
    version: 1,
    ...overrides,
  }
}

const D = (name: string): [string, string] => ['Dominio', name]
const S = (name: string): [string, string] => ['Servicio', name]

/**
 * 13 questions: Dominio Seguridad 5, Rendimiento 3, Costos 2 and 3 with no Dominio
 * (so "3 sin clasificar"); Servicio Amazon S3 5, Storage 2, VPC 3.
 */
export function questionsFixture(): ExamQuestion[] {
  return [
    questionFixture('seg-1', [D('Seguridad'), S('Amazon S3')], { stem: 'Un bucket público expone datos.' }),
    questionFixture('seg-2', [D('Seguridad'), S('Amazon S3')], { stem: 'Cifrado del bucket en reposo.' }),
    questionFixture('seg-3', [D('Seguridad'), S('Storage')]),
    questionFixture('seg-4', [D('Seguridad'), S('Storage'), ]),
    questionFixture('seg-5', [D('Seguridad'), S('VPC')]),
    questionFixture('ren-1', [D('Rendimiento'), S('Amazon S3')], { difficulty: 'hard', origin: { set: 'TD Set 1', number: 1 } }),
    questionFixture('ren-2', [D('Rendimiento'), S('VPC')], { origin: { set: 'TD Set 1', number: 2 } }),
    questionFixture('ren-3', [D('Rendimiento'), S('VPC')], { origin: { set: 'TD Set 2', number: 1 } }),
    questionFixture('cos-1', [D('Costos'), S('Amazon S3')]),
    questionFixture('cos-2', [D('Costos')]),
    questionFixture('sin-1', [S('Amazon S3')]),
    questionFixture('sin-2', []),
    questionFixture('sin-3', []),
  ]
}

export function examsSeedFixture(overrides: Partial<ExamsSeed> = {}): ExamsSeed {
  return { exams: [examFixture()], media: {}, questions: questionsFixture(), ...overrides }
}

/** A dry-run report with 3 creates and nothing wrong; override what a test cares about. */
export function reportFixture(overrides: Partial<ImportReport> = {}): ImportReport {
  return {
    dryRun: true,
    applied: false,
    counts: { create: 3, update: 0, unchanged: 0, invalid: 0 },
    keys: { create: ['aws-001', 'aws-002', 'aws-003'], update: [], unchanged: [] },
    errors: [],
    primary: null,
    newClassifications: [],
    newCategories: [],
    weightsAfter: [],
    duplicateStems: [],
    media: { referenced: 0, inZip: 0, missing: [], unused: [] },
    preview: [],
    warnings: [],
    ...overrides,
  }
}
