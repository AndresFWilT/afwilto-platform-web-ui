import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Dialog, Skeleton, Text, useToast } from '@afwilto/design-system'
import { useCertification } from '@/hooks/useCertification'
import { useServices } from '@/di'
import { StatusBadge } from '@/pages/shared/StatusBadge'
import { CategoryPill } from '@/pages/shared/CategoryPill'
import type { AttachmentKind, AttachmentMeta, Certification } from '@/application/ports'

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64 rounded" />
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <Text as="dt" variant="small" color="muted" className="sm:w-40 shrink-0">
        {label}
      </Text>
      <Text as="dd" variant="body">
        {value}
      </Text>
    </div>
  )
}

function AttachmentRow({
  attachment,
  getUrl,
  onRemove,
}: {
  attachment: AttachmentMeta
  getUrl: (id: string) => string
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Text variant="small" className="flex-1 truncate">
        <a
          href={getUrl(attachment.id)}
          download={attachment.fileName}
          className="text-primary-400 underline underline-offset-2"
        >
          {attachment.fileName}
        </a>
      </Text>
      <Text variant="small" color="muted">
        {(attachment.sizeBytes / 1024).toFixed(0)} KB
      </Text>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(attachment.id)}
        aria-label={`Remove ${attachment.kind}`}
      >
        Remove
      </Button>
    </div>
  )
}

function UploadButton({
  kind,
  certId,
  onUploaded,
}: {
  kind: AttachmentKind
  certId: string
  onUploaded: (meta: AttachmentMeta) => void
}) {
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const meta = await certificationJourneyService.uploadAttachment(certId, kind, file)
      showToast(`Attachment uploaded`, 'success')
      onUploaded(meta)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      showToast(msg, 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        data-testid={`upload-${kind}`}
        onChange={handleChange}
      />
      <Button
        variant="ghost"
        size="sm"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : `Upload ${kind}`}
      </Button>
    </div>
  )
}

function EvidenceSection({
  cert,
  onAttachmentChange,
}: {
  cert: Certification
  onAttachmentChange: (attachments: AttachmentMeta[]) => void
}) {
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const kinds: AttachmentKind[] = ['certificate', 'diploma']

  async function handleRemove(id: string) {
    try {
      await certificationJourneyService.removeAttachment(id)
      showToast('Attachment removed', 'success')
      onAttachmentChange(cert.attachments.filter((a) => a.id !== id))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Remove failed'
      showToast(msg, 'error')
    }
  }

  function handleUploaded(meta: AttachmentMeta) {
    const updated = cert.attachments.filter((a) => a.kind !== meta.kind)
    updated.push(meta)
    onAttachmentChange(updated)
  }

  return (
    <Card padding="md">
      <div className="flex flex-col gap-4">
        <Text as="h2" variant="h3">
          Evidence
        </Text>
        {kinds.map((kind) => {
          const existing = cert.attachments.find((a) => a.kind === kind)
          return (
            <div key={kind} className="flex flex-col gap-1">
              <Text variant="small" color="muted" className="capitalize">
                {kind}
              </Text>
              {existing ? (
                <AttachmentRow
                  attachment={existing}
                  getUrl={certificationJourneyService.attachmentUrl.bind(certificationJourneyService)}
                  onRemove={handleRemove}
                />
              ) : (
                <UploadButton kind={kind} certId={cert.id} onUploaded={handleUploaded} />
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function CertificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { certificationJourneyService } = useServices()
  const { showToast } = useToast()
  const { certification, loading, error } = useCertification(id ?? '')
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (certification) setAttachments(certification.attachments)
  }, [certification])

  async function handleDelete() {
    if (!certification) return
    setDeleting(true)
    try {
      await certificationJourneyService.remove(certification.id)
      showToast('Certification deleted', 'success')
      navigate('..')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete'
      showToast(msg, 'error')
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl flex flex-col gap-6">

        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
          ← Back
        </Button>

        {loading && <DetailSkeleton />}

        {error && (
          <Alert variant="error" title="Failed to load certification">
            {error.message}
          </Alert>
        )}

        {!loading && !error && certification === null && (
          <Alert variant="warning" title="Certification not found">
            The certification you are looking for does not exist or has been removed.
          </Alert>
        )}

        {!loading && !error && certification && (
          <>
            <div className="flex flex-col gap-2">
              <Text as="h1" variant="h2">
                {certification.name}
              </Text>
              <div className="flex items-center gap-3">
                <StatusBadge status={certification.status} />
                {certification.category && (
                  <CategoryPill path={certification.category.path} />
                )}
              </div>
            </div>

            <Card padding="md">
              <dl className="flex flex-col gap-4">
                {certification.studyStartDate && (
                  <DetailRow label="Study start" value={certification.studyStartDate} />
                )}
                {certification.expectedExamDate && (
                  <DetailRow label="Exam date" value={certification.expectedExamDate} />
                )}
                {/* Evidence survives a status regression as history (BR-EV2), so
                    show it only while the certification is actually achieved. */}
                {certification.status === 'achieved' && certification.achievedDate && (
                  <DetailRow label="Achieved" value={certification.achievedDate} />
                )}
                {certification.notes && (
                  <DetailRow label="Notes" value={certification.notes} />
                )}
                {certification.status === 'achieved' && certification.evidenceUrl && (
                  <DetailRow
                    label="Evidence"
                    value={
                      <a
                        href={certification.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 underline underline-offset-2"
                      >
                        View evidence
                      </a>
                    }
                  />
                )}
                <DetailRow
                  label="Created"
                  value={new Date(certification.createdAt).toLocaleDateString()}
                />
              </dl>
            </Card>

            {certification.status === 'achieved' && (
              <EvidenceSection
                cert={{ ...certification, attachments }}
                onAttachmentChange={setAttachments}
              />
            )}

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`../${certification.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>

            <Dialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              title={`Delete "${certification.name}"`}
              footer={
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              }
            >
              <Text variant="body" color="muted">
                This certification will be permanently removed. This action cannot be undone.
              </Text>
            </Dialog>
          </>
        )}

      </div>
    </div>
  )
}
