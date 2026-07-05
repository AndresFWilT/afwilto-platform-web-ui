import { createContext, useCallback, useContext, useRef, useState } from 'react'
import clsx from 'clsx'
import type { ToastContextValue, ToastItem, ToastProviderProps, ToastVariant } from './Toast.types'

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return ctx
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-success-500 text-success-300',
  error: 'border-error-500 text-error-300',
}

export function ToastProvider({ children, duration = 4000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextId.current++
      setToasts((current) => [...current, { id, message, variant }])
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, duration)
    },
    [duration]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              'rounded-md border px-4 py-3 text-sm shadow-lg',
              variantClasses[toast.variant]
            )}
            style={{ backgroundColor: 'var(--color-surface-overlay)' }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
