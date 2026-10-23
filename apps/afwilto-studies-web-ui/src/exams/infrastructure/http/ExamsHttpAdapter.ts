import type { IHttpClient } from '@afwilto/http-client'
import type { CreateExamInput, Exam } from '@/exams/domain'
import type { IExamsService } from '@/exams/application/ports'

export class ExamsHttpAdapter implements IExamsService {
  /** `apiUrl` is the API base (it already ends in `/api/v1`); media URLs are built from it. */
  constructor(_http: IHttpClient, _apiUrl: string) {}

  createExam(_subjectId: string, _input: CreateExamInput): Promise<Exam> {
    return Promise.reject(new Error('not implemented'))
  }

  mediaUrl(_sha256: string): string | null {
    return null
  }
}
