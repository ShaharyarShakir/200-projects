import { eq, or } from 'drizzle-orm'
import { db } from '../db'
import { products, type ProductRecord } from '../db/schema'

export interface FindProductPaddleParams {
  priceId?: string | null
  paddleProductId?: string | null
  slug?: string | null
}

/**
 * Finds a matching product in the database by Paddle price ID, Paddle product ID, or custom slug.
 */
export async function findProductByPaddleInfo(
  params: FindProductPaddleParams,
): Promise<ProductRecord | undefined> {
  const { priceId, paddleProductId, slug } = params

  const matchedProduct = await db
    .select()
    .from(products)
    .where(
      or(
        priceId ? eq(products.paddlePriceId, priceId) : undefined,
        paddleProductId ? eq(products.paddleProductId, paddleProductId) : undefined,
        slug ? eq(products.slug, slug) : undefined,
      ),
    )
    .get()

  return matchedProduct
}

/**
 * Returns the first active product as a safe fallback or default lookup.
 */
export async function getFirstActiveProduct(): Promise<ProductRecord | undefined> {
  return await db.select().from(products).get()
}
