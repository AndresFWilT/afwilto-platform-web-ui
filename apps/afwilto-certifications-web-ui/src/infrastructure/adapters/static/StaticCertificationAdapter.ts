import type { Certification, ICertificationService } from '@/application/ports'
import { CERTIFICATIONS } from '../../data/certifications'

const ROADMAP_ORDER: Record<string, number> = { 'in-progress': 0, planned: 1 }

export class StaticCertificationAdapter implements ICertificationService {
  private readonly certifications: Certification[]

  constructor(certifications: Certification[] = CERTIFICATIONS) {
    this.certifications = certifications
  }

  getCatalog(): Promise<Certification[]> {
    const catalog = this.certifications
      .filter((c) => c.status === 'obtained')
      .sort((a, b) => (b.obtainedDate ?? '').localeCompare(a.obtainedDate ?? ''))
    return Promise.resolve(catalog)
  }

  getRoadmap(): Promise<Certification[]> {
    const roadmap = this.certifications
      .filter((c) => c.status !== 'obtained')
      .sort((a, b) => ROADMAP_ORDER[a.status] - ROADMAP_ORDER[b.status])
    return Promise.resolve(roadmap)
  }

  getBySlug(slug: string): Promise<Certification | null> {
    return Promise.resolve(this.certifications.find((c) => c.slug === slug) ?? null)
  }
}
