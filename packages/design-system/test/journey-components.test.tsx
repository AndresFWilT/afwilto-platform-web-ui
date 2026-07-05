import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
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
  Button,
} from '@afwilto/design-system'
import type { TableColumn, TableSort } from '@afwilto/design-system'
import { useState } from 'react'

describe('Select', () => {
  it('renders options and reflects error state', () => {
    render(
      <Select aria-label="Sort" error>
        <option value="name">Name</option>
      </Select>
    )
    const select = screen.getByLabelText('Sort')
    expect(select.className).toContain('border-red-500')
  })

  it('fires onChange', () => {
    const onChange = vi.fn()
    render(
      <Select aria-label="Sort" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    )
    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalled()
  })
})

describe('Textarea', () => {
  it('renders with placeholder and error border', () => {
    render(<Textarea placeholder="Goal" error />)
    expect(screen.getByPlaceholderText('Goal').className).toContain('border-red-500')
  })
})

describe('Skeleton (GH-X1)', () => {
  it('renders an aria-hidden pulse block sized by className', () => {
    render(<Skeleton className="h-4 w-32" />)
    const el = screen.getByTestId('skeleton')
    expect(el.getAttribute('aria-hidden')).toBe('true')
    expect(el.className).toContain('animate-pulse')
    expect(el.className).toContain('w-32')
  })
})

describe('Tag', () => {
  it('renders children and dismiss control', () => {
    const onDismiss = vi.fn()
    render(<Tag onDismiss={onDismiss}>status: achieved</Tag>)
    fireEvent.click(screen.getByLabelText('Remove filter'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders no dismiss control without onDismiss', () => {
    render(<Tag>plain</Tag>)
    expect(screen.queryByLabelText('Remove filter')).toBeNull()
  })
})

describe('Dialog (a11y §11.3)', () => {
  it('opens with its title and closes via Esc (cancel event)', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Delete certification">
        Are you sure?
      </Dialog>
    )
    rerender(
      <Dialog open onClose={onClose} title="Delete certification">
        Are you sure?
      </Dialog>
    )
    const dialog = screen.getByLabelText('Delete certification')
    expect(dialog).toBeTruthy()
    fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders footer actions', () => {
    render(
      <Dialog open onClose={() => {}} title="Confirm" footer={<Button>OK</Button>}>
        body
      </Dialog>
    )
    expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy()
  })
})

function ToastTrigger() {
  const { showToast } = useToast()
  return (
    <Button onClick={() => showToast('Certification created', 'success')}>notify</Button>
  )
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('announces via a polite live region and auto-dismisses', () => {
    render(
      <ToastProvider duration={1000}>
        <ToastTrigger />
      </ToastProvider>
    )
    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-live')).toBe('polite')

    fireEvent.click(screen.getByRole('button', { name: 'notify' }))
    expect(region.textContent).toContain('Certification created')

    act(() => {
      vi.advanceTimersByTime(1100)
    })
    expect(region.textContent).not.toContain('Certification created')
  })

  it('useToast outside a provider throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ToastTrigger />)).toThrow(/ToastProvider/)
    spy.mockRestore()
  })
})

describe('Pagination (GH-L1 meta)', () => {
  it('shows meta text and disables edges', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} totalPages={3} totalItems={45} onPageChange={onPageChange} />)
    expect(screen.getByText(/Page 1 of 3/).textContent).toContain('45 items')
    expect((screen.getByLabelText('Previous page') as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('marks the current page with aria-current', () => {
    render(<Pagination page={2} totalPages={3} totalItems={45} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Page 2').getAttribute('aria-current')).toBe('page')
  })
})

describe('EmptyState (GH-T5, GH-X1)', () => {
  it('renders title, description and CTA slot', () => {
    render(
      <EmptyState
        icon="📚"
        title="Nothing planned for 2026"
        description="Your roadmap is empty."
        action={<Button>Plan a certification</Button>}
      />
    )
    expect(screen.getByText('Nothing planned for 2026')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Plan a certification' })).toBeTruthy()
  })
})

describe('DateField', () => {
  it('wires label to a native date input', () => {
    render(<DateField id="start" label="Study start" value="2026-08-01" onChange={() => {}} />)
    const input = screen.getByLabelText('Study start') as HTMLInputElement
    expect(input.type).toBe('date')
    expect(input.value).toBe('2026-08-01')
  })
})

interface Row {
  id: string
  name: string
  status: string
}

const columns: TableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
]

const rows: Row[] = [
  { id: '1', name: 'AWS SAA', status: 'planned' },
  { id: '2', name: 'CKA', status: 'achieved' },
]

function SortableTable() {
  const [sort, setSort] = useState<TableSort | undefined>(undefined)
  return (
    <Table columns={columns} rows={rows} rowKey={(r) => r.id} sort={sort} onSortChange={setSort} label="Certifications" />
  )
}

describe('Table (aria-sort, §11.3)', () => {
  it('renders rows and cycles aria-sort asc → desc', () => {
    render(<SortableTable />)
    expect(screen.getByRole('table', { name: 'Certifications' })).toBeTruthy()
    expect(screen.getAllByText('AWS SAA').length).toBeGreaterThan(0)

    const sortButton = screen.getByRole('button', { name: /Name/ })
    const th = sortButton.closest('th')!
    expect(th.getAttribute('aria-sort')).toBeNull()

    fireEvent.click(sortButton)
    expect(th.getAttribute('aria-sort')).toBe('ascending')
    fireEvent.click(sortButton)
    expect(th.getAttribute('aria-sort')).toBe('descending')
  })

  it('fires onRowClick', () => {
    const onRowClick = vi.fn()
    render(<Table columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} />)
    const cell = screen.getAllByText('CKA')[0]
    fireEvent.click(cell)
    expect(onRowClick).toHaveBeenCalledWith(rows[1])
  })
})
