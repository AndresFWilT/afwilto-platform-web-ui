import { FetchHttpClient } from '@afwilto/http-client'
import type { IStudiesService } from '@/application/ports'
import { StudiesHttpAdapter } from '@/infrastructure/adapters/http/StudiesHttpAdapter'
import { InMemoryStudiesAdapter } from '@/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import { devSeed } from '@/infrastructure/adapters/memory/devSeed'

export interface ServiceContainer {
  studiesService: IStudiesService
}

function createStudiesService(): IStudiesService {
  const apiUrl = import.meta.env['VITE_API_URL'] as string | undefined
  if (apiUrl) {
    return new StudiesHttpAdapter(new FetchHttpClient(apiUrl))
  }
  return new InMemoryStudiesAdapter(devSeed)
}

export const container: ServiceContainer = {
  studiesService: createStudiesService(),
}
