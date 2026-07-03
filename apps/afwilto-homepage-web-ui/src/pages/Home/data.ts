export type ProductStatus = 'live' | 'soon'

export interface Product {
  slug: string
  title: string
  description: string
  to: string
  icon: string
  status: ProductStatus
}

export const PRODUCTS: Product[] = [
  {
    slug: 'software-lab',
    title: 'Software Lab',
    description:
      'A living portfolio of academic software engineering projects — algorithms, data structures, schedulers, solvers and full apps built across two universities.',
    to: '/slab',
    icon: '🧪',
    status: 'live',
  },
  {
    slug: 'financial-status',
    title: 'Financial Status',
    description:
      'Personal finance tracker — accounts, budgets and spending insight in one place.',
    to: '/finance',
    icon: '📊',
    status: 'soon',
  },
  {
    slug: 'certifications',
    title: 'Certifications',
    description:
      'Certification catalog and learning roadmap — obtained badges and the path ahead.',
    to: '/certifications',
    icon: '🎓',
    status: 'soon',
  },
]
