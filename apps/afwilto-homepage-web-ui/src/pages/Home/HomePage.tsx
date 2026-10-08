import { Link } from 'react-router-dom'
import { BaseLayout, Text, Card, Button, Badge } from '@afwilto/design-system'
import { PRODUCTS, type Product } from './data'

export function HomePage() {
  return (
    <BaseLayout>
      <div className="flex flex-col gap-16">
        <Hero />
        <ProductsSection />
      </div>
    </BaseLayout>
  )
}

function Hero() {
  return (
    <section className="flex flex-col items-center text-center gap-6 py-12 sm:py-16 lg:py-20">
      <Badge variant="primary" size="md">Personal Engineering Ecosystem</Badge>

      <Text variant="h1" color="default" className="max-w-3xl">
        afwilto<span className="text-primary-400">.</span>
      </Text>

      <Text variant="body" color="muted" className="max-w-2xl leading-relaxed">
        Software engineer building in public. Everything here — academic labs,
        personal finance tooling, learning roadmaps — is designed, documented
        and shipped as independent products under one roof.
      </Text>
    </section>
  )
}

function ProductsSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Text variant="h2" color="default">Features</Text>
        <Text variant="body" color="muted">Pick a destination.</Text>
        <div className="h-px w-16 bg-primary-500 mt-1" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: Product }) {
  const body = (
    <Card padding="lg" className="flex h-full flex-col gap-4 group-hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl select-none">{product.icon}</span>
        {product.status === 'soon' && (
          <Badge variant="neutral" size="sm">Coming soon</Badge>
        )}
      </div>
      <Text variant="h4" color="default">{product.title}</Text>
      <Text variant="small" color="muted" className="leading-relaxed flex-1">
        {product.description}
      </Text>
      {product.status === 'live' && (
        <Button variant="ghost" size="sm" className="self-start">
          Enter →
        </Button>
      )}
    </Card>
  )

  if (product.status !== 'live') {
    return <div className="opacity-70">{body}</div>
  }

  return (
    <Link to={product.to} className="group block h-full">
      {body}
    </Link>
  )
}
