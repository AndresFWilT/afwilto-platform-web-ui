import clsx from 'clsx'
import { Text } from '../../atoms/Text'
import type { AlertProps } from './Alert.types'

const variantConfig: Record<string, { container: string; title: string; body: string; icon: string }> = {
  info: {
    container: 'bg-info-500/10 border-info-400/40',
    title: 'text-info-300',
    body: 'text-info-400',
    icon: 'ℹ',
  },
  success: {
    container: 'bg-success-500/10 border-success-500/40',
    title: 'text-success-300',
    body: 'text-success-400',
    icon: '✓',
  },
  warning: {
    container: 'bg-warning-500/10 border-warning-400/40',
    title: 'text-warning-300',
    body: 'text-warning-400',
    icon: '⚠',
  },
  error: {
    container: 'bg-error-500/10 border-error-400/40',
    title: 'text-error-300',
    body: 'text-error-400',
    icon: '✕',
  },
}

export function Alert({ variant, title, children, onClose, className, ...props }: AlertProps) {
  const config = variantConfig[variant]

  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-lg border p-4',
        config.container,
        className
      )}
      {...props}
    >
      <span className={clsx('text-lg font-bold shrink-0', config.title)} aria-hidden>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && (
          <Text variant="small" weight="semibold" className={config.title}>
            {title}
          </Text>
        )}
        <Text variant="small" className={config.body}>
          {children}
        </Text>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close alert"
          className={clsx('shrink-0 text-lg leading-none hover:opacity-70', config.title)}
        >
          ×
        </button>
      )}
    </div>
  )
}
