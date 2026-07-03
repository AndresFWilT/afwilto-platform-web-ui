import { describe, it, expect } from 'vitest'
import * as ds from '@afwilto/design-system'

describe('design-system barrel (AC-6)', () => {
  it.each([
    'Button',
    'Text',
    'Input',
    'Badge',
    'Spinner',
    'Card',
    'Alert',
    'FormField',
    'ErrorBoundary',
    'Navbar',
    'Footer',
    'BaseLayout',
    'AuthLayout',
  ])('exports %s', (name) => {
    expect(ds).toHaveProperty(name)
    expect(ds[name as keyof typeof ds]).toBeTruthy()
  })
})
