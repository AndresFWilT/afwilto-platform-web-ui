import { Text } from '../../atoms/Text'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-surface-border bg-surface-base mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Text variant="small" color="muted">
          © {year} AFWILTO Software Lab. All rights reserved.
        </Text>
        <Text variant="caption" color="muted">
          Built with React · Vite · Tailwind
        </Text>
      </div>
    </footer>
  )
}
