import type { Exam, ExamQuestion } from '../../src/exams/domain'
import type { ExamsSeed } from '../../src/exams/infrastructure/memory/InMemoryExamsAdapter'
import { EXAM_ID, SUBJECT_ID, examFixture } from './examFixtures'

/** The wall clock of a test: the adapter reads it, a test moves it. */
export class TestClock {
  private ms = Date.parse('2026-10-23T10:00:00.000Z')
  now = () => this.ms
  advance(seconds: number) {
    this.ms += seconds * 1000
  }
  set(ms: number) {
    this.ms = ms
  }
}

export const DOM = { seguridad: 'Seguridad', rendimiento: 'Rendimiento', resiliencia: 'Resiliencia', costos: 'Costos' }

/** An exam with Dominio (manual weights 30/26/24/20) and Servicio (VPC pace 10 q / 20 min, Lambda 4 q / 10 min, S3). */
export function bigExam(): Exam {
  const base = examFixture()
  const cat = (id: string, name: string, weightPercent: number | null, pace: [number, number] | null = null) => ({
    id,
    key: name.toLowerCase(),
    name,
    weightPercent,
    paceQuestions: pace?.[0] ?? null,
    paceMinutes: pace?.[1] ?? null,
    questionCount: 0,
  })
  return {
    ...base,
    id: EXAM_ID,
    subjectId: SUBJECT_ID,
    questionCount: 65,
    timeLimitMin: 130,
    passPercent: 72,
    classifications: [
      {
        id: 'c0000000-0000-7000-8000-000000000001',
        name: 'Dominio',
        position: 0,
        weightMode: 'manual',
        categories: [
          cat('a0000000-0000-7000-8000-000000000001', DOM.seguridad, 30),
          cat('a0000000-0000-7000-8000-000000000002', DOM.rendimiento, 26),
          cat('a0000000-0000-7000-8000-000000000003', DOM.resiliencia, 24),
          cat('a0000000-0000-7000-8000-000000000004', DOM.costos, 20),
        ],
      },
      {
        id: 'c0000000-0000-7000-8000-000000000002',
        name: 'Servicio',
        position: 1,
        weightMode: 'manual',
        categories: [
          cat('a0000000-0000-7000-8000-000000000011', 'VPC', null, [10, 20]),
          cat('a0000000-0000-7000-8000-000000000012', 'Lambda', null, [4, 10]),
          cat('a0000000-0000-7000-8000-000000000013', 'Amazon S3', null),
        ],
      },
    ],
  }
}

export const SERVICE = {
  classification: 'c0000000-0000-7000-8000-000000000002',
  vpc: 'a0000000-0000-7000-8000-000000000011',
  lambda: 'a0000000-0000-7000-8000-000000000012',
  s3: 'a0000000-0000-7000-8000-000000000013',
}

/** A single question with 4 options; the correct one rotates with the index. */
export function simpleQuestion(key: string, index: number, categories: Array<[string, string]>, overrides: Partial<ExamQuestion> = {}): ExamQuestion {
  const labels = ['A', 'B', 'C', 'D']
  return {
    id: `q-${key}`,
    examId: EXAM_ID,
    key,
    type: 'single',
    stem: `Pregunta ${key}`,
    categories: categories.map(([classification, name]) => ({ classification, name })),
    options: labels.map((label, i) => ({
      label,
      text: `Opción ${label} de ${key}`,
      correct: i === index % 4,
      rationale: `Racional ${label} de ${key}`,
    })),
    explanation: `Explicación de ${key}`,
    version: 1,
    ...overrides,
  }
}

/**
 * 40 questions per Dominio category (160), Servicio: the first 10 Seguridad ones are VPC, the first 4
 * Rendimiento ones Lambda, the next 6 Resiliencia ones Amazon S3; plus 5 with no Dominio at all.
 * `perDomain` overrides the count of one Dominio category (to force a shortage).
 */
export function bigBank(perDomain: Partial<Record<string, number>> = {}): ExamQuestion[] {
  const questions: ExamQuestion[] = []
  let n = 0
  for (const domain of Object.values(DOM)) {
    const count = perDomain[domain] ?? 40
    for (let i = 0; i < count; i++) {
      const service: Array<[string, string]> =
        domain === DOM.seguridad && i < 10 ? [['Servicio', 'VPC']] : domain === DOM.rendimiento && i < 4 ? [['Servicio', 'Lambda']] : domain === DOM.resiliencia && i < 6 ? [['Servicio', 'Amazon S3']] : []
      questions.push(simpleQuestion(`${domain.toLowerCase()}-${i + 1}`, n++, [['Dominio', domain], ...service]))
    }
  }
  for (let i = 0; i < 5; i++) questions.push(simpleQuestion(`sin-${i + 1}`, n++, []))
  return questions
}

export function bigSeed(overrides: Partial<ExamsSeed> = {}, perDomain: Partial<Record<string, number>> = {}): ExamsSeed {
  return { exams: [bigExam()], media: {}, questions: bigBank(perDomain), ...overrides }
}
