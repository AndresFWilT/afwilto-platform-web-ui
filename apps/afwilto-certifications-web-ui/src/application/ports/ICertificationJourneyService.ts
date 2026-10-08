export type CertificationStatus = 'planned' | 'in_progress' | 'achieved' | 'expired' | 'abandoned'

export type AttachmentKind = 'certificate' | 'diploma'

// Which wire field a certification's single evidence URL lives in. The backend
// stores two (credlyUrl, officialUrl); the UI shows one and must write back to
// the field it read from (Spec 14 BR-EVT1).
export type EvidenceUrlSource = 'credly' | 'official'

export interface AttachmentMeta {
  id: string
  kind: AttachmentKind
  fileName: string
  contentType: string
  sizeBytes: number
}

export interface CertificationCategory {
  id: string
  path: string
  normalizedPath: string
  color: string
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
  evidenceUrlSource?: EvidenceUrlSource
  attachments: AttachmentMeta[]
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

// Merge-patch: an absent key leaves the field untouched, `null` clears it
// (Spec 14 BR-PATCH1/2). `name` and `status` are never null (BR-PATCH3).
export interface UpdateCertificationCommand {
  name?: string
  status?: CertificationStatus
  categoryPath?: string | null
  studyStartDate?: string | null
  expectedExamDate?: string | null
  achievedDate?: string | null
  notes?: string | null
  evidenceUrl?: string | null
  /** Where `evidenceUrl` is written. Defaults to `credly` (BR-EVT1). */
  evidenceUrlTarget?: EvidenceUrlSource
}

// Represents every category, not only ones currently in use — `count: 0` is a
// valid, expected value (e.g. a just-created category with no certifications yet).
export interface Category {
  id: string
  path: string
  normalizedPath: string
  color: string // '#RRGGBB', uppercase
  count: number
}

export interface CreateCategoryCommand {
  path: string
  color: string
}

export interface UpdateCategoryCommand {
  path?: string
  color?: string
}

export interface ICertificationJourneyService {
  list(query?: ListQuery): Promise<CertificationPage>
  getById(id: string): Promise<Certification | null>
  create(cmd: CreateCertificationCommand): Promise<Certification>
  update(id: string, patch: UpdateCertificationCommand): Promise<Certification>
  remove(id: string): Promise<void>
  listCategories(): Promise<Category[]>
  createCategory(cmd: CreateCategoryCommand): Promise<Category>
  updateCategory(id: string, patch: UpdateCategoryCommand): Promise<Category>
  deleteCategory(id: string): Promise<void>
  uploadAttachment(certId: string, kind: AttachmentKind, file: File): Promise<AttachmentMeta>
  attachmentUrl(attachmentId: string): string
  removeAttachment(attachmentId: string): Promise<void>
}
