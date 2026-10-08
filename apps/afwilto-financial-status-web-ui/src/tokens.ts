// Chart palette — every value derives from @afwilto/design-system.
// `income`/`expense` are the app's domain aliases of the shared
// success/error scales (mirrors the aliases in index.css @theme).

import { colors as ds } from '@afwilto/design-system'

export const colors = {
  primary: ds.primary,
  info: ds.info,
  income: ds.success,
  expense: ds.error,
  warning: ds.warning,
  surface: ds.surface,
  neutral: ds.neutral,
  border: ds.surface.border,
  text: {
    primary: ds.neutral[100],
    secondary: ds.neutral[400],
    muted: ds.neutral[500],
  },
} as const
