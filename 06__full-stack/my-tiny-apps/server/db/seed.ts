import { eq } from 'drizzle-orm'
import { db } from './index'
import { products } from './schema'

export async function seed() {
  console.log('🌱 Checking seed data...')

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.slug, 'tiny-compressor'))
    .get()

  const now = new Date()

  if (!existingProduct) {
    console.log('Inserting initial product: Tiny Compressor...')
    await db.insert(products).values({
      slug: 'tiny-compressor',
      name: 'Tiny Compressor',
      description:
        'Minimal, fast, on-device image and PDF compression utility for Android and iOS.',
      priceCents: 500,
      currency: 'USD',
      paddleProductId: process.env.PADDLE_PRODUCT_ID || null,
      paddlePriceId: process.env.PADDLE_PRICE_ID || null,
      gitlabProjectId: 'my-tiny-apps/tiny-compressor',
      gitlabReleaseTag: 'v1.0.0',
      status: 'coming-soon',
      createdAt: now,
      updatedAt: now,
    })
    console.log('✅ Seeded Tiny Compressor successfully.')
  } else {
    console.log('ℹ️ Product "tiny-compressor" already exists.')
  }
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err)
      process.exit(1)
    })
}

