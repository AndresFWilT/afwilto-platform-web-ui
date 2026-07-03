export type CertificationStatus = 'obtained' | 'in-progress' | 'planned'

export interface Certification {
  slug: string
  name: string
  provider: string
  status: CertificationStatus
  description: string
  skills: string[]
  icon: string
  obtainedDate?: string
  targetDate?: string
  link?: string
}

export interface ICertificationService {
  getCatalog(): Promise<Certification[]>
  getRoadmap(): Promise<Certification[]>
  getBySlug(slug: string): Promise<Certification | null>
}
