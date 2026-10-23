import type { RevealInfo, ViewQuestion } from '../../src/exams/domain'

// Shaped after docs/specs/18-exam-simulations/examples/*.json (labels are assigned by display order).
export const SIGN_SHA = 'a1'.repeat(32)
export const YIELD_SHA = 'b2'.repeat(32)
export const STOP_SHA = 'c3'.repeat(32)

/** T1: text stem, text options (aws-text example 1). */
export const t1: ViewQuestion = {
  type: 'single',
  chooseCount: 1,
  stem: 'A company wants to grant an EC2 instance access to an S3 bucket **without storing long-term credentials** on the instance. What should a solutions architect do?',
  options: [
    { label: 'A', text: "Store an IAM user's access keys in the instance user data." },
    { label: 'B', text: 'Attach an IAM role to the instance through an instance profile.' },
    { label: 'C', text: 'Make the bucket public and restrict it by IP address.' },
  ],
}

export const t1Reveal: RevealInfo = {
  correctLabels: ['B'],
  rationales: {
    A: 'User data is readable from the instance and the keys are long-term.',
    B: 'The role delivers temporary credentials that rotate automatically.',
    C: 'A public bucket is not access control for a workload.',
  },
  explanation: 'Instance profiles give EC2 temporary credentials from STS.',
}

/** T1, multi: choose two (aws-text example 2). */
export const multi2: ViewQuestion = {
  type: 'multi',
  chooseCount: 2,
  stem: 'Which **two** actions improve the upload speed of large objects? (Choose two.)',
  options: [
    { label: 'A', text: 'Enable S3 Transfer Acceleration.' },
    { label: 'B', text: 'Use multipart upload.' },
    { label: 'C', text: 'Enable S3 Versioning.' },
    { label: 'D', text: 'Change the storage class to S3 Glacier.' },
  ],
}

/** T2: stem image, text options (moto example 1). */
export const t2: ViewQuestion = {
  type: 'single',
  chooseCount: 1,
  stem: `¿Qué indica esta señal?\n\n![Disco rojo con una barra horizontal blanca](media:${SIGN_SHA})`,
  options: [
    { label: 'A', text: 'Entrada prohibida' },
    { label: 'B', text: 'Circulación prohibida' },
    { label: 'C', text: 'Fin de prohibiciones' },
  ],
}

/** T3: image options with one text-only option (moto example 2). */
export const t3: ViewQuestion = {
  type: 'single',
  chooseCount: 1,
  stem: 'Cuál es la señal de **ceda el paso**?',
  options: [
    { label: 'A', image: `media:${YIELD_SHA}`, alt: 'Triángulo invertido blanco con borde rojo' },
    { label: 'B', image: `media:${STOP_SHA}`, alt: 'Octágono rojo con la palabra STOP' },
    { label: 'C', text: 'Ninguna de las anteriores' },
  ],
}

export const resolveMedia = (sha: string): string | null => `/media/${sha}`
