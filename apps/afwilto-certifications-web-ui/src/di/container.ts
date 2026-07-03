import type { ICertificationService } from '@/application/ports'
import { StaticCertificationAdapter } from '@/infrastructure/adapters/static/StaticCertificationAdapter'

export interface ServiceContainer {
  certificationService: ICertificationService
}

export const container: ServiceContainer = {
  certificationService: new StaticCertificationAdapter(),
}
