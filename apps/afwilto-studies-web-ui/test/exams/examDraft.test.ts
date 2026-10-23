import { describe, it, expect } from 'vitest'
import { checkDraft, draftFrom, type ExamDraft } from '../../src/exams/domain'
import { CAT, CLS, examFixture } from './examFixtures'

const exam = () => examFixture()
const draft = (change: (d: ExamDraft) => void = () => {}) => {
  const d = draftFrom(exam())
  change(d)
  return d
}

describe('draftFrom', () => {
  it('holds every field of the exam as text, keyed by id', () => {
    expect(draftFrom(exam())).toEqual({
      params: { name: 'SAA-C03', questionCount: '65', timeLimitMin: '130', passPercent: '72' },
      classificationNames: { [CLS.dominio]: 'Dominio', [CLS.servicio]: 'Servicio' },
      primaryId: CLS.dominio,
      categories: {
        [CAT.seguridad]: { name: 'Seguridad', paceQuestions: '', paceMinutes: '' },
        [CAT.rendimiento]: { name: 'Rendimiento', paceQuestions: '', paceMinutes: '' },
        [CAT.costos]: { name: 'Costos', paceQuestions: '', paceMinutes: '' },
        [CAT.s3]: { name: 'Amazon S3', paceQuestions: '', paceMinutes: '' },
        [CAT.storage]: { name: 'Storage', paceQuestions: '', paceMinutes: '' },
        [CAT.vpc]: { name: 'VPC', paceQuestions: '', paceMinutes: '' },
      },
      weights: { [CAT.seguridad]: '40', [CAT.rendimiento]: '40', [CAT.costos]: '20' },
    })
  })

  it('carries an existing pace pair', () => {
    const e = exam()
    Object.assign(e.classifications[1].categories[2], { paceQuestions: 10, paceMinutes: 20 })
    expect(draftFrom(e).categories[CAT.vpc]).toMatchObject({ paceQuestions: '10', paceMinutes: '20' })
  })

  it('an exam without classifications has no primary and no weights', () => {
    const d = draftFrom(examFixture({ classifications: [] }))
    expect(d).toMatchObject({ primaryId: null, categories: {}, weights: {} })
  })
})

describe('checkDraft: nothing to send', () => {
  it('an untouched draft has no patch and no problems', () => {
    expect(checkDraft(exam(), draft())).toEqual({ problems: {}, weightsSum: 100 })
  })
})

describe('checkDraft: parameters', () => {
  it('sends only the parameters that changed, with the version', () => {
    const check = checkDraft(exam(), draft((d) => { d.params.passPercent = '80'; d.params.name = '  SAA-C04 ' }))
    expect(check.patch).toEqual({ version: 1, name: 'SAA-C04', passPercent: 80 })
  })

  it('an invalid parameter is a problem on its field and blocks the patch', () => {
    const check = checkDraft(exam(), draft((d) => { d.params.name = ''; d.params.timeLimitMin = '601' }))
    expect(check.patch).toBeUndefined()
    expect(check.problems).toEqual({ name: 'El nombre es obligatorio', timeLimitMin: 'Debe estar entre 1 y 600' })
  })
})

describe('checkDraft: names and pace', () => {
  it('sends renamed classifications and categories only', () => {
    const check = checkDraft(exam(), draft((d) => {
      d.classificationNames[CLS.dominio] = ' Área '
      d.categories[CAT.storage].name = 'Almacenamiento'
    }))
    expect(check.patch).toEqual({
      version: 1,
      classifications: [{ id: CLS.dominio, name: 'Área' }],
      categories: [{ id: CAT.storage, name: 'Almacenamiento' }],
    })
  })

  it('a blank name is a problem on its classification or category', () => {
    const check = checkDraft(exam(), draft((d) => { d.classificationNames[CLS.servicio] = ' '; d.categories[CAT.vpc].name = '' }))
    expect(Object.keys(check.problems).sort()).toEqual([`category:${CAT.vpc}`, `classification:${CLS.servicio}`].sort())
    expect(check.patch).toBeUndefined()
  })

  it('a complete pace pair is sent as numbers', () => {
    const check = checkDraft(exam(), draft((d) => { d.categories[CAT.vpc].paceQuestions = '10'; d.categories[CAT.vpc].paceMinutes = '20' }))
    expect(check.patch).toEqual({ version: 1, categories: [{ id: CAT.vpc, paceQuestions: 10, paceMinutes: 20 }] })
  })

  it('clearing both values of a pace pair sends null for both', () => {
    const e = exam()
    Object.assign(e.classifications[1].categories[2], { paceQuestions: 10, paceMinutes: 20 })
    const d = draftFrom(e)
    d.categories[CAT.vpc].paceQuestions = ''
    d.categories[CAT.vpc].paceMinutes = ''
    expect(checkDraft(e, d).patch).toEqual({ version: 1, categories: [{ id: CAT.vpc, paceQuestions: null, paceMinutes: null }] })
  })

  it.each([
    { q: '10', m: '', label: 'only the questions' },
    { q: '', m: '5', label: 'only the minutes' },
    { q: '0', m: '5', label: 'a zero' },
    { q: '2.5', m: '5', label: 'a fraction' },
  ])('$label is a pace problem and blocks the patch', ({ q, m }) => {
    const check = checkDraft(exam(), draft((d) => { d.categories[CAT.vpc].paceQuestions = q; d.categories[CAT.vpc].paceMinutes = m }))
    expect(check.problems[`pace:${CAT.vpc}`]).toBe('Indica ambos valores del ritmo o ninguno (enteros desde 1)')
    expect(check.patch).toBeUndefined()
  })
})

describe('checkDraft: weights (S08-4)', () => {
  it('weights that sum to 99 are a problem and show the sum', () => {
    const check = checkDraft(exam(), draft((d) => { d.weights[CAT.costos] = '19' }))
    expect(check.weightsSum).toBe(99)
    expect(check.problems.weights).toBe('Los pesos deben sumar 100')
    expect(check.patch).toBeUndefined()
  })

  it('weights that sum to 100 send every primary category', () => {
    const check = checkDraft(exam(), draft((d) => { d.weights[CAT.seguridad] = '30'; d.weights[CAT.costos] = '30' }))
    expect(check.weightsSum).toBe(100)
    expect(check.problems).toEqual({})
    expect(check.patch).toEqual({
      version: 1,
      weights: [{ categoryId: CAT.seguridad, percent: 30 }, { categoryId: CAT.rendimiento, percent: 40 }, { categoryId: CAT.costos, percent: 30 }],
    })
  })

  it('a blank weight counts as 0', () => {
    const check = checkDraft(exam(), draft((d) => { d.weights[CAT.costos] = ''; d.weights[CAT.seguridad] = '60' }))
    expect(check.weightsSum).toBe(100)
    expect(check.patch?.weights?.find((w) => w.categoryId === CAT.costos)?.percent).toBe(0)
  })

  it.each(['-5', '2.5', 'abc'])('the weight "%s" is a problem', (value) => {
    const check = checkDraft(exam(), draft((d) => { d.weights[CAT.costos] = value }))
    expect(check.problems.weights).toBe('Los pesos son enteros de 0 a 100')
  })
})

describe('checkDraft: swapping the primary', () => {
  it('sends the new primary and ignores the weights, which are inferred again', () => {
    const check = checkDraft(exam(), draft((d) => { d.primaryId = CLS.servicio; d.weights[CAT.costos] = '1' }))
    expect(check.patch).toEqual({ version: 1, primaryClassificationId: CLS.servicio })
    expect(check.problems).toEqual({})
  })
})

describe('checkDraft: everything at once', () => {
  it('builds one atomic patch', () => {
    const check = checkDraft(exam(), draft((d) => {
      d.params.questionCount = '50'
      d.classificationNames[CLS.servicio] = 'Servicios'
      d.categories[CAT.s3].paceQuestions = '4'
      d.categories[CAT.s3].paceMinutes = '8'
      d.weights[CAT.seguridad] = '50'
      d.weights[CAT.rendimiento] = '30'
    }))
    expect(check.patch).toEqual({
      version: 1,
      questionCount: 50,
      classifications: [{ id: CLS.servicio, name: 'Servicios' }],
      weights: [{ categoryId: CAT.seguridad, percent: 50 }, { categoryId: CAT.rendimiento, percent: 30 }, { categoryId: CAT.costos, percent: 20 }],
      categories: [{ id: CAT.s3, paceQuestions: 4, paceMinutes: 8 }],
    })
  })
})
