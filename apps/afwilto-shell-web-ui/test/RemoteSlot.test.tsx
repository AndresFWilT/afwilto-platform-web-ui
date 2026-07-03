import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { lazy } from 'react'
import { RemoteSlot } from '@/remotes/RemoteSlot'

describe('RemoteSlot (AC-4)', () => {
  it('shows the loading state while the remote chunk is pending', () => {
    const NeverResolves = lazy(() => new Promise<never>(() => {}))
    render(<RemoteSlot component={NeverResolves} />)
    expect(screen.getByTestId('remote-loading')).toBeTruthy()
  })

  it('renders the remote once its module resolves', async () => {
    const Resolved = lazy(() =>
      Promise.resolve({ default: () => <p>remote ok</p> })
    )
    render(<RemoteSlot component={Resolved} />)
    expect(await screen.findByText('remote ok')).toBeTruthy()
  })

  it('renders the error fallback instead of crashing when the remote import rejects', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Failing = lazy(() => Promise.reject(new Error('remoteEntry.js unreachable')))
    render(<RemoteSlot component={Failing} />)
    expect(await screen.findByText('Something went wrong')).toBeTruthy()
    consoleSpy.mockRestore()
  })
})
