import type { Exam, ExamQuestion } from '@/exams/domain'

// Offline dev bank: 24 generated questions per Dominio category (enough for the 19/17/16/13 quotas of a
// 65-question simulation), spread over a few services and two original sets.
const DOMINIOS = ['Seguridad', 'Rendimiento', 'Resiliencia', 'Costos']
const SERVICIOS = ['Amazon S3', 'VPC', 'Lambda']
const PER_DOMINIO = 24

export function devQuestions(examId: string): ExamQuestion[] {
  return DOMINIOS.flatMap((dominio, d) =>
    Array.from({ length: PER_DOMINIO }, (_, i): ExamQuestion => {
      const n = d * PER_DOMINIO + i + 1
      const servicio = SERVICIOS[n % SERVICIOS.length]
      const correct = n % 4
      return {
        id: `f1000000-0000-7000-8000-${String(n).padStart(12, '0')}`,
        examId,
        key: `dev-${String(n).padStart(3, '0')}`,
        type: 'single',
        stem: `**${dominio} · ${servicio}** (pregunta de ejemplo ${n}). ¿Qué opción es la correcta?`,
        explanation: `La opción ${'ABCD'[correct]} es la correcta en esta pregunta de ejemplo.`,
        origin: { set: n % 2 === 0 ? 'Set de ejemplo 1' : 'Set de ejemplo 2', number: Math.ceil(n / 2) },
        categories: [
          { classification: 'Dominio', name: dominio },
          { classification: 'Servicio', name: servicio },
        ],
        options: ['A', 'B', 'C', 'D'].map((label, o) => ({
          label,
          text: `Opción ${label} de la pregunta ${n}`,
          correct: o === correct,
          rationale: o === correct ? 'Es la opción correcta.' : 'No es la opción correcta.',
        })),
        version: 1,
      }
    })
  )
}

/** SAA-C03's classifications for the dev bank: Dominio with the official weights 30/26/24/20, and Servicio. */
export function devClassifications(): Exam['classifications'] {
  const cat = (id: string, name: string, weightPercent: number | null) => ({
    id,
    key: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    weightPercent,
    paceQuestions: null,
    paceMinutes: null,
    questionCount: 0,
  })
  return [
    {
      id: 'f2000000-0000-7000-8000-000000000001',
      name: 'Dominio',
      position: 0,
      weightMode: 'manual',
      categories: [
        cat('f3000000-0000-7000-8000-000000000001', 'Seguridad', 30),
        cat('f3000000-0000-7000-8000-000000000002', 'Rendimiento', 26),
        cat('f3000000-0000-7000-8000-000000000003', 'Resiliencia', 24),
        cat('f3000000-0000-7000-8000-000000000004', 'Costos', 20),
      ],
    },
    {
      id: 'f2000000-0000-7000-8000-000000000002',
      name: 'Servicio',
      position: 1,
      weightMode: 'inferred',
      categories: [
        cat('f3000000-0000-7000-8000-000000000011', 'Amazon S3', null),
        cat('f3000000-0000-7000-8000-000000000012', 'VPC', null),
        cat('f3000000-0000-7000-8000-000000000013', 'Lambda', null),
      ],
    },
  ]
}
