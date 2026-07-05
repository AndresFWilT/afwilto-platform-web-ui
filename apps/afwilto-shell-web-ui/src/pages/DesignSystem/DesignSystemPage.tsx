import { useState } from 'react'
import {
  BaseLayout,
  Text,
  Button,
  Input,
  Badge,
  Spinner,
  FormField,
  Card,
  Alert,
  Select,
  Textarea,
  Skeleton,
  Tag,
  Dialog,
  ToastProvider,
  useToast,
  Pagination,
  EmptyState,
  DateField,
  Table,
} from '@afwilto/design-system'
import type { TableColumn, TableSort } from '@afwilto/design-system'
import { colors } from '@afwilto/design-system'

export function DesignSystemPage() {
  return (
    <BaseLayout>
      <ToastProvider>
        <div className="flex flex-col gap-16 pb-16">
          <PageHeader />
          <ColorsSection />
          <TypographySection />
          <AtomsSection />
          <MoleculesSection />
          <JourneySection />
          <OrganismsNote />
        </div>
      </ToastProvider>
    </BaseLayout>
  )
}

/* ── Page header ─────────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex flex-col gap-3 pt-4 border-b border-surface-border pb-8">
      <Badge variant="neutral" size="sm">v1.0.0</Badge>
      <Text variant="h1" color="default">Design System</Text>
      <Text variant="body" color="muted" className="max-w-2xl">
        Component library and visual language for AFWILTO Software Lab.
        Built with Atomic Design — from tokens to pages.
      </Text>
    </div>
  )
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Text variant="h2" color="default">{title}</Text>
        <div className="h-px w-10 bg-primary-500" />
      </div>
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Text variant="h4" color="muted">{title}</Text>
      {children}
    </div>
  )
}

function ShowRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="caption" color="muted" className="uppercase tracking-widest">{label}</Text>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/* ── Colors ──────────────────────────────────────────────────────────────── */

function ColorsSection() {
  return (
    <Section title="Colors">
      <SubSection title="Brand Palette">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {(Object.entries(colors.brand) as [string, string][]).map(([shade, hex]) => (
            <ColorSwatch key={shade} shade={shade} hex={hex} />
          ))}
        </div>
      </SubSection>

      <SubSection title="Primary / Accent">
        <div className="grid grid-cols-5 gap-2">
          {(Object.entries(colors.primary) as [string, string][]).map(([shade, hex]) => (
            <ColorSwatch key={shade} shade={shade} hex={hex} />
          ))}
        </div>
      </SubSection>

      <SubSection title="Semantic">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(colors.semantic) as [string, string][]).map(([name, hex]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className="w-12 h-12 rounded-lg shadow-md border border-white/10"
                style={{ backgroundColor: hex }}
              />
              <Text variant="caption" color="muted" className="capitalize">{name}</Text>
              <Text variant="caption" color="muted" className="font-mono opacity-60">{hex}</Text>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Surfaces">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(colors.surface) as [string, string][]).map(([name, hex]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className="w-16 h-10 rounded-lg border border-white/10"
                style={{ backgroundColor: hex }}
              />
              <Text variant="caption" color="muted" className="capitalize">{name}</Text>
              <Text variant="caption" color="muted" className="font-mono opacity-60">{hex}</Text>
            </div>
          ))}
        </div>
      </SubSection>
    </Section>
  )
}

function ColorSwatch({ shade, hex }: { shade: string; hex: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : hex}
      className="flex flex-col items-center gap-1 group"
    >
      <div
        className="w-full aspect-square rounded-md border border-white/10 group-hover:scale-105 transition-transform"
        style={{ backgroundColor: hex }}
      />
      <Text variant="caption" color="muted">{shade}</Text>
    </button>
  )
}

/* ── Typography ──────────────────────────────────────────────────────────── */

function TypographySection() {
  return (
    <Section title="Typography">
      <Card padding="md" className="flex flex-col divide-y divide-surface-border">
        {TYPOGRAPHY_ROWS.map(({ variant, label, sample }) => (
          <div key={variant} className="flex flex-col sm:flex-row sm:items-baseline gap-2 py-4 first:pt-0 last:pb-0">
            <Text variant="caption" color="muted" className="sm:w-24 shrink-0 uppercase tracking-widest">
              {label}
            </Text>
            <Text variant={variant as any} color="default">{sample}</Text>
          </div>
        ))}
      </Card>
    </Section>
  )
}

const TYPOGRAPHY_ROWS = [
  { variant: 'h1', label: 'h1', sample: 'Heading One — Software Lab' },
  { variant: 'h2', label: 'h2', sample: 'Heading Two — Architecture' },
  { variant: 'h3', label: 'h3', sample: 'Heading Three — Design System' },
  { variant: 'h4', label: 'h4', sample: 'Heading Four — Components' },
  { variant: 'body', label: 'body', sample: 'Body text — Regular paragraph with full readability at 16px and 1.5 line height.' },
  { variant: 'small', label: 'small', sample: 'Small text — Supporting copy and labels at 14px.' },
  { variant: 'caption', label: 'caption', sample: 'Caption — Metadata and timestamps at 12px.' },
  { variant: 'mono', label: 'mono', sample: 'const lab = new SoftwareLab()' },
]

/* ── Atoms ───────────────────────────────────────────────────────────────── */

function AtomsSection() {
  const [inputVal, setInputVal] = useState('')

  return (
    <Section title="Atoms">
      {/* Button */}
      <SubSection title="Button">
        <ShowRow label="Variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="info">Info</Button>
        </ShowRow>
        <ShowRow label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </ShowRow>
        <ShowRow label="States">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button fullWidth variant="secondary">Full Width</Button>
        </ShowRow>
      </SubSection>

      {/* Badge */}
      <SubSection title="Badge">
        <ShowRow label="Variants">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </ShowRow>
        <ShowRow label="Sizes">
          <Badge variant="primary" size="sm">Small</Badge>
          <Badge variant="primary" size="md">Medium</Badge>
        </ShowRow>
      </SubSection>

      {/* Spinner */}
      <SubSection title="Spinner">
        <ShowRow label="Sizes">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="sm" />
              <Text variant="caption" color="muted">sm</Text>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <Text variant="caption" color="muted">md</Text>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <Text variant="caption" color="muted">lg</Text>
            </div>
          </div>
        </ShowRow>
      </SubSection>

      {/* Input */}
      <SubSection title="Input">
        <div className="flex flex-col gap-4 max-w-md">
          <ShowRow label="Default">
            <Input
              placeholder="Enter value…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="max-w-xs"
            />
          </ShowRow>
          <ShowRow label="With icons">
            <Input
              placeholder="Search…"
              leftIcon={<span className="text-xs">🔍</span>}
              className="max-w-xs"
            />
            <Input
              placeholder="Email"
              rightIcon={<span className="text-xs">✉</span>}
              className="max-w-xs"
            />
          </ShowRow>
          <ShowRow label="Error state">
            <Input
              placeholder="Invalid value"
              error
              defaultValue="wrong@"
              className="max-w-xs"
            />
          </ShowRow>
          <ShowRow label="Sizes">
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Input inputSize="sm" placeholder="Small" />
              <Input inputSize="md" placeholder="Medium" />
              <Input inputSize="lg" placeholder="Large" />
            </div>
          </ShowRow>
        </div>
      </SubSection>
    </Section>
  )
}

/* ── Molecules ───────────────────────────────────────────────────────────── */

function MoleculesSection() {
  const [alertOpen, setAlertOpen] = useState(true)

  return (
    <Section title="Molecules">
      {/* Card */}
      <SubSection title="Card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="sm"><Text variant="small" color="muted">Padding sm</Text></Card>
          <Card padding="md"><Text variant="small" color="muted">Padding md</Text></Card>
          <Card padding="lg"><Text variant="small" color="muted">Padding lg</Text></Card>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card padding="md" shadow={false}><Text variant="small" color="muted">No shadow</Text></Card>
          <Card padding="md" border={false}><Text variant="small" color="muted">No border</Text></Card>
        </div>
      </SubSection>

      {/* Alert */}
      <SubSection title="Alert">
        <div className="flex flex-col gap-3 max-w-xl">
          <Alert variant="info" title="Information">
            Here is some helpful information about your action.
          </Alert>
          <Alert variant="success" title="Success">
            Your changes have been saved successfully.
          </Alert>
          <Alert variant="warning" title="Warning">
            This action cannot be undone. Proceed with caution.
          </Alert>
          <Alert variant="error" title="Error">
            Something went wrong. Please try again later.
          </Alert>
          {alertOpen && (
            <Alert variant="info" title="Dismissible" onClose={() => setAlertOpen(false)}>
              Click the × to close this alert.
            </Alert>
          )}
        </div>
      </SubSection>

      {/* FormField */}
      <SubSection title="FormField">
        <div className="flex flex-col gap-4 max-w-md">
          <FormField
            id="name"
            label="Full name"
            placeholder="Andrés Wilches"
            helperText="Your full name as it appears in official documents."
            required
          />
          <FormField
            id="email-err"
            label="Email address"
            placeholder="you@example.com"
            errorMessage="Please enter a valid email address."
            defaultValue="not-an-email"
            type="email"
          />
        </div>
      </SubSection>
    </Section>
  )
}

/* ── Journey additions (spec 11) ─────────────────────────────────────────── */

function JourneySection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tags, setTags] = useState(['status: achieved', 'category: TI / Cloud'])
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<TableSort | undefined>(undefined)
  const { showToast } = useToast()

  const rows = [
    { id: '1', name: 'AWS SAA', status: 'in_progress' },
    { id: '2', name: 'CKA', status: 'achieved' },
  ]
  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ]

  return (
    <Section title="Journey Components">
      <SubSection title="Select & Textarea">
        <div className="flex flex-col gap-4 max-w-md">
          <Select aria-label="Sort by" defaultValue="createdAt">
            <option value="createdAt">Newest first</option>
            <option value="name">Name</option>
          </Select>
          <Textarea placeholder="Why are you pursuing this certification?" />
        </div>
      </SubSection>

      <SubSection title="Skeleton & EmptyState">
        <div className="flex flex-col gap-2 max-w-md">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Card padding="none" border>
          <EmptyState
            icon="📚"
            title="Nothing planned yet"
            description="Register your first certification to start the journey."
            action={<Button size="sm">Plan a certification</Button>}
          />
        </Card>
      </SubSection>

      <SubSection title="Tag, Toast, Dialog & DateField">
        <ShowRow label="Dismissible tags">
          {tags.map((t) => (
            <Tag key={t} onDismiss={() => setTags(tags.filter((x) => x !== t))}>
              {t}
            </Tag>
          ))}
        </ShowRow>
        <ShowRow label="Actions">
          <Button size="sm" onClick={() => showToast('Saved successfully', 'success')}>
            Show toast
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDialogOpen(true)}>
            Open dialog
          </Button>
        </ShowRow>
        <div className="max-w-xs">
          <DateField id="ds-date" label="Expected exam date" defaultValue="2026-11-15" />
        </div>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Delete certification"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDialogOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <Text variant="body" color="muted">
            This hides the certification everywhere. The record is kept for a future trash view.
          </Text>
        </Dialog>
      </SubSection>

      <SubSection title="Table & Pagination">
        <Table columns={columns} rows={rows} rowKey={(r) => r.id} sort={sort} onSortChange={setSort} label="Demo certifications" />
        <Pagination page={page} totalPages={3} totalItems={45} onPageChange={setPage} />
      </SubSection>
    </Section>
  )
}

/* ── Organisms note ──────────────────────────────────────────────────────── */

function OrganismsNote() {
  return (
    <Section title="Organisms">
      <Card padding="md" className="flex flex-col gap-3">
        <Text variant="h4" color="primary">Navbar & Footer</Text>
        <Text variant="body" color="muted">
          Both organisms are active on this page — look up and down. The{' '}
          <span className="text-neutral-200 font-mono text-sm">Navbar</span> handles responsive
          navigation with mobile hamburger, active-route highlighting, and brand identity.
          The <span className="text-neutral-200 font-mono text-sm">Footer</span> provides
          site-wide closing context.
        </Text>
        <div className="flex flex-col gap-2 mt-2">
          <Text variant="small" color="muted">
            <span className="text-neutral-300 font-medium">BaseLayout</span> — wraps every page with Navbar + main content area + Footer.
          </Text>
          <Text variant="small" color="muted">
            <span className="text-neutral-300 font-medium">AuthLayout</span> — centered card layout for login/signup flows.
          </Text>
        </div>
      </Card>
    </Section>
  )
}
