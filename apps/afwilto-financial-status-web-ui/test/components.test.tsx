import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../src/components/StatCard'
import CategoryBadge from '../src/components/CategoryBadge'

describe('StatCard on the shared design system (AC-5)', () => {
  it('renders on the shared Card surface', () => {
    const { container } = render(<StatCard label="Balance" value="$100" />)
    expect(container.querySelector('.bg-surface-raised')).not.toBeNull()
  })

  it.each([
    ['income', 'text-income-500'],
    ['expense', 'text-expense-500'],
    ['primary', 'text-primary-400'],
    ['accent', 'text-info-400'],
  ] as const)('variant %s colours the value with %s', (variant, cls) => {
    render(<StatCard label={variant} value="$1" variant={variant} />)
    expect(screen.getByText('$1').className).toContain(cls)
  })

  it('renders no glow styling', () => {
    const { container } = render(
      <StatCard label="Net" value="$2" variant="primary" />
    )
    expect(container.innerHTML).not.toMatch(/glow/)
  })
})

describe('CategoryBadge tokens (AC-6)', () => {
  const categories = [
    'Salary', 'Freelance', 'Investment', 'Bonus',
    'Housing', 'Food', 'Transport', 'Entertainment',
    'Health', 'Education', 'Utilities', 'Other', 'Unknown',
  ]

  it.each(categories)('%s renders only migrated token families', (category) => {
    render(<CategoryBadge category={category} />)
    const el = screen.getAllByText(category === 'Unknown' ? 'Unknown' : category).at(-1)!
    expect(el.className).not.toMatch(/(?:purple|dark)-\d|text-text-/)
    expect(el.className).toMatch(/(?:income|expense|warning|primary|info|brand|neutral)-/)
  })
})

describe('no raw form controls in pages (AC-11)', () => {
  it('pages and components render no raw <input> (DS Input required)', async () => {
    const { readFileSync, readdirSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((e) => {
        const f = join(d, e)
        return statSync(f).isDirectory() ? walk(f) : f.endsWith('.tsx') ? [f] : []
      })
    for (const f of [...walk('src/pages'), ...walk('src/components')]) {
      expect(readFileSync(f, 'utf-8'), `${f} uses raw <input>`).not.toMatch(/<input[\s>]/)
    }
  })
})
