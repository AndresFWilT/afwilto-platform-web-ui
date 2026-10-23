import { FetchHttpClient } from '@afwilto/http-client'
import type { IStudiesService } from '@/application/ports'
import { StudiesHttpAdapter } from '@/infrastructure/adapters/http/StudiesHttpAdapter'
import { InMemoryStudiesAdapter } from '@/infrastructure/adapters/memory/InMemoryStudiesAdapter'
import type { IExamsService } from '@/exams/application/ports'
import { ExamsHttpAdapter } from '@/exams/infrastructure/http/ExamsHttpAdapter'
import { InMemoryExamsAdapter } from '@/exams/infrastructure/memory/InMemoryExamsAdapter'
import { examsDevSeed } from '@/exams/infrastructure/memory/devSeed'
import { devSeed } from '@/infrastructure/adapters/memory/devSeed'

export interface ServiceContainer {
  studiesService: IStudiesService
  examsService: IExamsService
}

function createStudiesService(): IStudiesService {
  const apiUrl = import.meta.env['VITE_API_URL'] as string | undefined
  if (apiUrl) {
    return new StudiesHttpAdapter(new FetchHttpClient(apiUrl))
  }
  return new InMemoryStudiesAdapter(devSeed)
}

function createExamsService(): IExamsService {
  const apiUrl = import.meta.env['VITE_API_URL'] as string | undefined
  if (apiUrl) {
    return new ExamsHttpAdapter(new FetchHttpClient(apiUrl), apiUrl)
  }
  return new InMemoryExamsAdapter(examsDevSeed)
}

export const container: ServiceContainer = {
  studiesService: createStudiesService(),
  examsService: createExamsService(),
}
