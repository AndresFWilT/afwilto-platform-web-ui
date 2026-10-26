import { describe, it, expect } from 'vitest'
import { checkDraft, draftFrom, violationProblems, type ExamDraft, type UpdateExamInput } from '../../src/exams/domain'
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
    expect(check.problems).toEqual({ name: 'The name is required', timeLimitMin: 'Must be between 1 and 600' })
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
    expect(check.problems[`pace:${CAT.vpc}`]).toBe('Enter both pace values or neither (whole numbers from 1)')
    expect(check.patch).toBeUndefined()
  })
})

describe('checkDraft: weights (S08-4)', () => {
  it('weights that sum to 99 are a problem and show the sum', () => {
    const check = checkDraft(exam(), draft((d) => { d.weights[CAT.costos] = '19' }))
    expect(check.weightsSum).toBe(99)
    expect(check.problems.weights).toBe('Weights must add up to 100')
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
    expect(check.problems.weights).toBe('Weights are whole numbers from 0 to 100')
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

describe('checkDraft: client ranges mirror the server (contract 0.3.0, M4)', () => {
  const PACE = 'The pace takes whole numbers from 1 to 10,000'
  const vpc = (q: string, m: string) => checkDraft(exam(), draft((d) => { d.categories[CAT.vpc].paceQuestions = q; d.categories[CAT.vpc].paceMinutes = m }))

  it('a pace value of 10,000 is sent, 10,001 is refused on either side', () => {
    expect(vpc('10000', '10000').patch?.categories).toEqual([{ id: CAT.vpc, paceQuestions: 10000, paceMinutes: 10000 }])
    expect(vpc('10001', '5').problems[`pace:${CAT.vpc}`]).toBe(PACE)
    expect(vpc('5', '10001').problems[`pace:${CAT.vpc}`]).toBe(PACE)
    expect(vpc('10001', '5').patch).toBeUndefined()
  })

  it('a weight of 100 is accepted, 101 is refused as out of range (not as a wrong sum)', () => {
    const weights = (seguridad: string) => checkDraft(exam(), draft((d) => { d.weights = { [CAT.seguridad]: seguridad, [CAT.rendimiento]: '0', [CAT.costos]: '0' } }))
    expect(weights('100').patch?.weights).toEqual([{ categoryId: CAT.seguridad, percent: 100 }, { categoryId: CAT.rendimiento, percent: 0 }, { categoryId: CAT.costos, percent: 0 }])
    expect(weights('101').problems.weights).toBe('Weights are whole numbers from 0 to 100')
    expect(weights('101').patch).toBeUndefined()
  })

  it('a classification name of 40 characters is sent, 41 is refused', () => {
    const rename = (name: string) => checkDraft(exam(), draft((d) => { d.classificationNames[CLS.servicio] = name }))
    expect(rename('x'.repeat(40)).patch?.classifications).toEqual([{ id: CLS.servicio, name: 'x'.repeat(40) }])
    expect(rename('x'.repeat(41)).problems[`classification:${CLS.servicio}`]).toBe('The name can have up to 40 characters')
  })

  it('a category name of 80 characters is sent, 81 is refused', () => {
    const rename = (name: string) => checkDraft(exam(), draft((d) => { d.categories[CAT.vpc].name = name }))
    expect(rename('x'.repeat(80)).patch?.categories).toEqual([{ id: CAT.vpc, name: 'x'.repeat(80) }])
    expect(rename('x'.repeat(81)).problems[`category:${CAT.vpc}`]).toBe('The name can have up to 80 characters')
  })
})

describe('violationProblems: server 422 field errors land on the form fields (contract 0.3.0, M4)', () => {
  const patch: UpdateExamInput = {
    version: 1,
    classifications: [{ id: CLS.servicio, name: 'Servicio 2' }],
    categories: [{ id: CAT.s3, name: 'S3' }, { id: CAT.vpc, paceQuestions: 5, paceMinutes: 5 }],
    weights: [{ categoryId: CAT.seguridad, percent: 40 }, { categoryId: CAT.rendimiento, percent: 40 }, { categoryId: CAT.costos, percent: 20 }],
  }
  const v = (field: string, rule: string, message = 'server text') => ({ field, rule, message })

  it('maps pace fields through the patch index to the category row', () => {
    expect(violationProblems(patch, [v('categories[1].paceQuestions', 'range')]).problems).toEqual({ [`pace:${CAT.vpc}`]: 'The pace takes whole numbers from 1 to 10,000' })
    expect(violationProblems(patch, [v('categories[1].pace', 'pace_pair')]).problems).toEqual({ [`pace:${CAT.vpc}`]: 'Enter both pace values or neither (whole numbers from 1)' })
  })

  it('maps weights[i].percent and weights_sum to the weights table', () => {
    expect(violationProblems(patch, [v('weights[2].percent', 'range')]).problems).toEqual({ weights: 'Weights are whole numbers from 0 to 100' })
    expect(violationProblems(patch, [v('weights', 'weights_sum')]).problems).toEqual({ weights: 'Weights must add up to 100' })
  })

  it('maps invalid_text and range on names to their rows, with Spanish messages', () => {
    expect(violationProblems(patch, [v('classifications[0].name', 'invalid_text')]).problems).toEqual({ [`classification:${CLS.servicio}`]: 'The text contains characters that are not allowed' })
    expect(violationProblems(patch, [v('categories[0].name', 'range')]).problems).toEqual({ [`category:${CAT.s3}`]: 'The name can have up to 80 characters' })
  })

  it('maps the exam parameters: name invalid_text, questionCount range', () => {
    expect(violationProblems(patch, [v('name', 'invalid_text'), v('questionCount', 'range')]).problems).toEqual({
      name: 'The text contains characters that are not allowed',
      questionCount: 'Must be between 1 and 200',
    })
  })

  it('a violation that matches no field (or an index outside the patch) is returned as unmapped text', () => {
    const result = violationProblems(patch, [v('primaryClassificationId', 'primary_single_valued', 'two values'), v('categories[9].name', 'range', 'gone')])
    expect(result.problems).toEqual({})
    expect(result.unmapped).toEqual(['two values', 'gone'])
  })
})
