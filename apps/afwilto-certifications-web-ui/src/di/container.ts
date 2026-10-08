import { FetchHttpClient } from '@afwilto/http-client'
import type { ICertificationJourneyService } from '@/application/ports'
import { CertificationHttpAdapter } from '@/infrastructure/adapters/http/CertificationHttpAdapter'
import { InMemoryCertificationAdapter } from '@/infrastructure/adapters/memory/InMemoryCertificationAdapter'

export interface ServiceContainer {
  certificationJourneyService: ICertificationJourneyService
}

function createCertificationService(): ICertificationJourneyService {
  const apiUrl = import.meta.env['VITE_CERTIFICATIONS_API_URL'] as string | undefined
  if (apiUrl) {
    return new CertificationHttpAdapter(new FetchHttpClient(apiUrl), apiUrl)
  }
  return new InMemoryCertificationAdapter()
}

export const container: ServiceContainer = {
  certificationJourneyService: createCertificationService(),
}
