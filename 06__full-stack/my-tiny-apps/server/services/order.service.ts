import crypto from 'node:crypto'
import { db } from '../db'
import { orders, type OrderRecord } from '../db/schema'

export interface CreateOrderParams {
  productId: number
  customerEmail: string
  paddleTransactionId: string
  paddleCustomerId?: string | null
  amountCents: number
  currency: string
}

/**
 * Generates a human-friendly unique order reference code (e.g. MTA-M1X8K9-AB12).
 */
export function generateOrderNumber(): string {
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `MTA-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`
}

/**
 * Creates a new paid order record in the database.
 */
export async function createOrder(data: CreateOrderParams): Promise<OrderRecord> {
  const orderNumber = generateOrderNumber()
  const now = new Date()

  const [newOrder] = await db
    .insert(orders)
    .values({
      orderNumber,
      productId: data.productId,
      customerEmail: data.customerEmail,
      paddleTransactionId: data.paddleTransactionId,
      paddleCustomerId: data.paddleCustomerId ?? null,
      amountCents: data.amountCents,
      currency: data.currency,
      status: 'paid',
      createdAt: now,
      paidAt: now,
    })
    .returning()

  return newOrder
}
