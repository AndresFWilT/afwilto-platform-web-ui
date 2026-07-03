import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, Alert, ErrorBoundary } from '@afwilto/design-system'

describe('Button (AC-7)', () => {
  it('renders its children', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('loading disables the button', () => {
    render(<Button loading>Save</Button>)
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true)
  })

  it('not loading and not disabled stays enabled', () => {
    render(<Button>Save</Button>)
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('Alert (AC-7)', () => {
  it('renders with role="alert" and its message', () => {
    render(<Alert variant="error">Something failed</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toContain('Something failed')
  })

  it('renders a close control that fires onClose', () => {
    const onClose = vi.fn()
    render(<Alert variant="info" onClose={onClose}>Note</Alert>)
    fireEvent.click(screen.getByLabelText('Close alert'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders no close control without onClose', () => {
    render(<Alert variant="info">Note</Alert>)
    expect(screen.queryByLabelText('Close alert')).toBeNull()
  })
})

describe('ErrorBoundary (AC-7)', () => {
  function Bomb(): never {
    throw new Error('kaboom')
  }

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>safe content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('safe content')).toBeTruthy()
  })

  it('renders the custom fallback with the thrown error when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary fallback={(error) => <p>fallback: {error.message}</p>}>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('fallback: kaboom')).toBeTruthy()
    consoleSpy.mockRestore()
  })

  it('renders the default fallback when none is provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    consoleSpy.mockRestore()
  })
})
