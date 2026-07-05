export type CertificationStatus = 'planned' | 'in_progress' | 'achieved' | 'expired' | 'abandoned'

export interface CertificationCategory {
  id: string
  path: string
  normalizedPath: string
}

export interface Certification {
  id: string
  name: string
  status: CertificationStatus
  category?: CertificationCategory
  studyStartDate?: string
  expectedExamDate?: string
  achievedDate?: string
  notes?: string
  evidenceUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ListMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface CertificationPage {
  items: Certification[]
  meta: ListMeta
}

export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: CertificationStatus
  categoryPrefix?: string
  year?: number
  sortBy?: 'name' | 'status' | 'achievedDate' | 'expectedExamDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateCertificationCommand {
  name: string
  status?: CertificationStatus
  categoryPath?: string
  studyStartDate?: string
  expectedExamDate?: string
  achievedDate?: string
  notes?: string
  evidenceUrl?: string
}

export interface UpdateCertificationCommand {
  name?: string
  status?: CertificationStatus
  categoryPath?: string | null
  studyStartDate?: string | null
  expectedExamDate?: string | null
  achievedDate?: string | null
  notes?: string | null
  evidenceUrl?: string | null
}

export interface CategoryInUse {
  id: string
  path: string
  normalizedPath: string
  count: number
}

export interface ICertificationJourneyService {
  list(query?: ListQuery): Promise<CertificationPage>
  getById(id: string): Promise<Certification | null>
  create(cmd: CreateCertificationCommand): Promise<Certification>
  update(id: string, patch: UpdateCertificationCommand): Promise<Certification>
  remove(id: string): Promise<void>
  listCategories(): Promise<CategoryInUse[]>
}
