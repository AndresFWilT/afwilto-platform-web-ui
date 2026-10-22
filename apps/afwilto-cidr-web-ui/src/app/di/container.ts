import { FetchHttpClient } from '@afwilto/http-client'
import type { ICidrCalculator } from '@/cidr/application/ports'
import { CidrHttpAdapter } from '@/cidr/infrastructure/http/CidrHttpAdapter'
import { UnconfiguredCalculator } from '@/cidr/infrastructure/unconfigured/UnconfiguredCalculator'
import type { ServiceContainer } from '@/shared/di'

// Composition root: the only module that knows concrete adapters.
function createCalculator(): ICidrCalculator {
  const apiUrl = import.meta.env['VITE_API_URL'] as string | undefined
  return apiUrl ? new CidrHttpAdapter(new FetchHttpClient(apiUrl)) : new UnconfiguredCalculator()
}

export const container: ServiceContainer = {
  calculator: createCalculator(),
}
